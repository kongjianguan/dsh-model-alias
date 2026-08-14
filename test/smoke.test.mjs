/**
 * Smoke test: the full pi-ai request chain with the plugin's injection,
 * against a local mock OpenAI-completions endpoint.
 *
 * Verifies that a mapped DSH-facing model id is rewritten on the wire while
 * an unmapped model goes out untouched, that mapping edits are picked up
 * without re-arming, and that an existing onPayload hook composes.
 */
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { armAdapter, apply } from "../lib/index.js";
import { normalizeConfig } from "../lib/rewrite.js";

const home = process.env.DSH_HOME ?? `${process.env.HOME}/.dsh`;
// pi-ai ships import-only exports, so import its dist files by URL through
// the profile node_modules chain (the flat fallback dir symlinks the real
// package; parent walk from a profile would find it the same way).
const piAiRoot = `${home}/profiles/node_modules/@earendil-works/pi-ai`;
const { createModels, createProvider } = await import(pathToFileURL(`${piAiRoot}/dist/index.js`));
const openaiCompletions = await import(pathToFileURL(`${piAiRoot}/dist/api/openai-completions.js`));

let passed = 0;
function test(label, fn) {
	fn();
	passed++;
	console.log(`ok - ${label}`);
}

/** Record POST /v1/chat/completions bodies and reply with a minimal SSE stream. */
async function startMockServer() {
	const bodies = [];
	const server = http.createServer((req, res) => {
		if (req.method === "POST" && req.url === "/v1/chat/completions") {
			let raw = "";
			req.on("data", (chunk) => (raw += chunk));
			req.on("end", () => {
				bodies.push(JSON.parse(raw));
				const chunk = (obj) => `data: ${JSON.stringify(obj)}\n\n`;
				res.writeHead(200, { "content-type": "text/event-stream" });
				res.write(chunk({ id: "chatcmpl-1", object: "chat.completion.chunk", created: 0, model: "any", choices: [{ index: 0, delta: { role: "assistant", content: "ok" }, finish_reason: null }] }));
				res.write(chunk({ id: "chatcmpl-1", object: "chat.completion.chunk", created: 0, model: "any", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] }));
				res.end(chunk("[DONE]"));
			});
			return;
		}
		res.writeHead(404).end();
	});
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const { port } = server.address();
	return { server, port, bodies };
}

async function main() {
	const { server, port, bodies } = await startMockServer();
	const baseUrl = `http://127.0.0.1:${port}/v1`;
	try {
		const models = createModels();
		const flash = { id: "deepseek-v4-flash", name: "DSH Facing", api: "openai-completions", provider: "test-route", baseUrl, reasoning: true, input: ["text"], contextWindow: 1000000, maxTokens: 384000 };
		const pro = { id: "deepseek-v4-pro", name: "Pro", api: "openai-completions", provider: "test-route", baseUrl, reasoning: true, input: ["text"], contextWindow: 1000000, maxTokens: 384000 };
		models.setProvider(createProvider({
			id: "test-route",
			name: "Test Route",
			baseUrl,
			auth: {
				apiKey: {
					name: "test",
					resolve: async () => ({ auth: { apiKey: "test-key" }, source: "test" })
				}
			},
			models: [flash, pro],
			api: openaiCompletions
		}));

		const context = { messages: [{ role: "user", content: "hi", timestamp: 0 }] };
		const consume = async (model, options = {}) => {
			const stream = models.streamSimple(model, context, options);
			for await (const event of stream) {
				if (event.type === "done") return event;
				if (event.type === "error") throw new Error(`stream error: ${event.error?.errorMessage ?? JSON.stringify(event.error)}`);
			}
			throw new Error("stream ended without a terminal event");
		};

		// 1. Mapped model: wire request carries the wire id.
		let maps = normalizeConfig({ providers: { "test-route": { "deepseek-v4-flash": "deepseek-v4-flash-0731" } } }).map;
		const fakeAdapter = {
			current: () => ({ models })
		};
		armAdapter(fakeAdapter, () => maps, console, new WeakSet(), new WeakSet());
		fakeAdapter.current(); // mirror apply(): force the snapshot through the wrapper
		await consume(flash);
		assert.equal(bodies.at(-1).model, "deepseek-v4-flash-0731", "mapped model must be rewritten on the wire");
		console.log("ok - mapped model is rewritten on the wire");

		// 2. Unmapped model: untouched.
		await consume(pro);
		assert.equal(bodies.at(-1).model, "deepseek-v4-pro", "unmapped model must go out under its own id");
		console.log("ok - unmapped model is untouched");

		// 3. Mapping edit (new config generation) is picked up without re-arming.
		maps = normalizeConfig({ providers: { "test-route": { "deepseek-v4-pro": "pro-wire-name" } } }).map;
		await consume(pro);
		assert.equal(bodies.at(-1).model, "pro-wire-name", "mapping edits must apply on the next request");
		console.log("ok - mapping edits apply without re-arming");

		// 4. armAdapter is idempotent: re-arming must not double-rewrite or break.
		armAdapter(fakeAdapter, () => maps, console, new WeakSet(), new WeakSet());
		await consume(pro);
		assert.equal(bodies.at(-1).model, "pro-wire-name");
		console.log("ok - re-arming is idempotent");

		// 5. Existing onPayload hook composes with the rewrite.
		maps = normalizeConfig({ providers: { "test-route": { "deepseek-v4-flash": "deepseek-v4-flash-0731" } } }).map;
		const previousHook = async (payload) => ({ ...payload, temperature: 0.25 });
		await consume(flash, { onPayload: previousHook });
		assert.equal(bodies.at(-1).model, "deepseek-v4-flash-0731");
		assert.equal(bodies.at(-1).temperature, 0.25);
		console.log("ok - a previous onPayload hook composes with the rewrite");

		// 6. Non-pi-ai adapters are skipped (no `current` method).
		let armed = false;
		const other = { stream: () => {} };
		armAdapter(other, () => maps, console, new WeakSet(), new WeakSet());
		assert.equal(armed, false);
		console.log("ok - non-pi-ai adapters are skipped");

		// 7. apply() end-to-end: entry config + fake loader ctx + llm registry,
		//    adapter registered *after* apply (via llm/adapters-updated).
		bodies.length = 0;
		const listeners = new Map();
		const fakeCtx = {
			baseUrl: pathToFileURL(`${home}/profiles/web/`).href,
			logger: console,
			inject: () => {},
			on: (event, fn) => listeners.set(event, fn),
			llm: { adapters: new Map() }
		};
		apply(fakeCtx, { providers: { "test-route": { "deepseek-v4-flash": "deepseek-v4-flash-0731" } } });
		assert.equal(typeof listeners.get("llm/adapters-updated"), "function", "apply must listen for llm/adapters-updated");
		const adapter = { current: () => ({ models }) };
		fakeCtx.llm.adapters.set("test-route", { adapter, provider: { id: "test-route" } });
		listeners.get("llm/adapters-updated")();
		await consume(flash);
		assert.equal(bodies.at(-1).model, "deepseek-v4-flash-0731", "apply() wiring must rewrite the wire model");
		console.log("ok - apply() end-to-end (entry config, late adapter registration)");
	} finally {
		server.close();
	}

	console.log(`\n${passed + 7} smoke checks passed`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
