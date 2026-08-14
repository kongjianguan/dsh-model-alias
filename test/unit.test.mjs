/**
 * Unit tests for lib/rewrite.js — config normalization and payload rewriting.
 */
import assert from "node:assert/strict";
import { normalizeConfig, rewritePayload, composeOnPayload } from "../lib/rewrite.js";

let passed = 0;
function test(label, fn) {
	fn();
	passed++;
	console.log(`ok - ${label}`);
}

test("normalizeConfig: happy path", () => {
	const { map, skipped } = normalizeConfig({
		providers: {
			"token-rhythm": { "deepseek-v4-flash": "deepseek-v4-flash-0731" },
			"other-route": { "model-a": "wire-a", "model-b": "wire-b" }
		}
	});
	assert.deepEqual(skipped, []);
	assert.equal(map.size, 2);
	assert.deepEqual([...map.get("token-rhythm")], [["deepseek-v4-flash", "deepseek-v4-flash-0731"]]);
	assert.deepEqual([...map.get("other-route")], [["model-a", "wire-a"], ["model-b", "wire-b"]]);
});

test("normalizeConfig: empty section resolves to an empty map", () => {
	const { map, skipped } = normalizeConfig({});
	assert.deepEqual(skipped, []);
	assert.equal(map.size, 0);
});

test("normalizeConfig: drops invalid entries and reports them", () => {
	const { map, skipped } = normalizeConfig({
		providers: {
			"": { "a": "b" },
			"ok-route": { "": "wire", "model": "", "good": "fine" },
			"not-an-object": "nope"
		}
	});
	assert.equal(map.size, 1);
	assert.equal(map.get("ok-route").get("good"), "fine");
	assert.ok(skipped.length >= 4, `expected >=4 skipped entries, got ${skipped.length}`);
});

test("normalizeConfig: identity mapping is kept (no-op, visible config)", () => {
	const { map } = normalizeConfig({ providers: { r: { same: "same" } } });
	assert.equal(map.get("r").get("same"), "same");
});

test("normalizeConfig: non-object raw is tolerated", () => {
	for (const raw of [undefined, null, 42, "x", []]) {
		const { map, skipped } = normalizeConfig(raw);
		assert.equal(map.size, 0);
		assert.deepEqual(skipped, []);
	}
});

test("rewritePayload: openai/anthropic style `model` field", () => {
	const payload = { model: "deepseek-v4-flash", messages: [], stream: true };
	const out = rewritePayload(payload, "deepseek-v4-flash-0731");
	assert.deepEqual(out, { model: "deepseek-v4-flash-0731", messages: [], stream: true });
	assert.notEqual(out, payload, "must return a new object, not mutate");
});

test("rewritePayload: bedrock style `modelId` field", () => {
	const payload = { modelId: "deepseek-v4-flash", inferenceConfig: {} };
	assert.deepEqual(rewritePayload(payload, "wire"), { modelId: "wire", inferenceConfig: {} });
});

test("rewritePayload: non-rewriteable shapes return undefined (leave untouched)", () => {
	assert.equal(rewritePayload(null, "w"), undefined);
	assert.equal(rewritePayload("str", "w"), undefined);
	assert.equal(rewritePayload([], "w"), undefined);
	assert.equal(rewritePayload({ nope: 1 }, "w"), undefined);
	assert.equal(rewritePayload({ model: 42 }, "w"), undefined);
});

test("composeOnPayload: no previous hook", async () => {
	const hook = composeOnPayload("wire-id", undefined);
	assert.deepEqual(await hook({ model: "dsh-id" }), { model: "wire-id" });
});

test("composeOnPayload: previous hook result is preserved through the rewrite", async () => {
	const previous = async (payload) => ({ ...payload, temperature: 0.5 });
	const hook = composeOnPayload("wire-id", previous);
	const out = await hook({ model: "dsh-id", stream: true });
	assert.deepEqual(out, { model: "wire-id", stream: true, temperature: 0.5 });
});

test("composeOnPayload: previous hook returning undefined keeps the original payload", async () => {
	const hook = composeOnPayload("wire-id", async () => undefined);
	assert.deepEqual(await hook({ model: "dsh-id" }), { model: "wire-id" });
});

test("composeOnPayload: non-rewriteable payload after previous hook stays untouched", async () => {
	const hook = composeOnPayload("wire-id", async (p) => ({ ...p, extra: 1 }));
	const out = await hook({ noModel: true });
	assert.deepEqual(out, { noModel: true, extra: 1 });
});

console.log(`\n${passed} unit tests passed`);
