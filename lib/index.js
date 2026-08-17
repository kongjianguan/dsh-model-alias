/**
 * dsh-model-alias — provider-scoped model name mapping for the pi-ai LLM
 * adapter (dsh-llm-pi-ai).
 *
 * The harness keys every model fact (reasoning levels, max output tokens,
 * context window) by the model id it resolves in the provider catalog, and
 * that same id is what pi-ai puts on the wire — "the harness model name IS
 * the wire model name". Providers whose real model ids differ (a gateway
 * serving `deepseek-v4-flash-0731`, a proxy renaming every model, ...) can
 * therefore not reuse the harness-known id without the wire request carrying
 * a name the provider does not serve.
 *
 * This plugin decouples the two: per provider route, a mapping
 *
 * ```yaml
 * dsh-model-alias:
 *   providers:
 *     token-rhythm:
 *       deepseek-v4-flash: deepseek-v4-flash-0731
 * ```
 *
 * keeps `deepseek-v4-flash` as the harness-facing id (sessions, logs, model
 * picker, reasoning metadata all keep using it) while every request to the
 * provider goes out with `deepseek-v4-flash-0731` in the body. The rewrite
 * happens inside pi-ai's `onPayload` hook, which every supported protocol
 * invokes with the exact request body right before sending; a missing or
 * non-rewriteable payload leaves the request untouched.
 *
 * Mechanism: the adapter's `current()` builds an immutable snapshot holding
 * the pi-ai `Models` collection. This plugin wraps `current()` so each fresh
 * collection's `streamSimple` (and `stream`) is patched once to inject
 * `onPayload`. The mapping table is read per request from a closure variable,
 * so editing only this namespace's settings takes effect on the next request
 * without touching the adapter snapshot. `llm/adapters-updated` re-arms when
 * adapter registrations change (HMR, route edits).
 *
 * Web surface: this plugin also serves a browser settings page (see
 * `lib/client.js`) backed by two Host-side webServer routes —
 * `GET /dma/api/config` and `POST /dma/api/config` — that read and write the
 * `dsh-model-alias` settings section through the settings service, so edits
 * from the page land in `settings.yaml` and re-arm the mapping. The settings
 * namespaces exposed over the wire RPC are an explicit apiproxy allowlist a
 * third-party plugin cannot join, which is why the page reads through these
 * routes instead of the settings scope.
 *
 * The plugin is intentionally dependency-free at module scope: it resolves
 * harness packages through the profile's node_modules chain (the loader
 * anchors `ctx.baseUrl` at the profile directory), so a checkout living
 * outside the profile — e.g. `~/workspace/git_repo/` — still works. If the
 * harness packages are unresolvable, the plugin degrades to entry-config-only
 * mode with a warning.
 */

import { createRequire } from "node:module";
import { normalizeConfig, composeOnPayload } from "./rewrite.js";

export const name = "dsh-model-alias";
/** The `llm` service must be live before we can arm. */
export const inject = ["llm"];

/** Resolve the profile's node_modules chain, falling back to our own location. */
function profileRequire(ctx) {
	try {
		return createRequire(new URL("package.json", ctx.baseUrl));
	} catch {
		return createRequire(import.meta.url);
	}
}

/**
 * Wrap one adapter instance so every snapshot it builds gets its pi-ai
 * `Models` collection patched. The patch reads the mapping table through
 * `getMaps()` at request time, so mapping edits never need a re-patch.
 * Idempotent per adapter instance and per Models collection.
 *
 * @param adapter - a pi-ai-backed adapter (duck-typed: has `current()`).
 * @param getMaps - returns `Map<route, Map<dshFacingId, wireId>>`.
 * @param logger - `ctx.logger`.
 * @param wrapped - shared WeakSet of already-wrapped adapters (per apply).
 * @param patched - shared WeakSet of already-patched Models collections.
 */
export function armAdapter(adapter, getMaps, logger, wrapped, patched) {
	if (typeof adapter.current !== "function") return;
	if (wrapped.has(adapter)) return;
	wrapped.add(adapter);
	const original = adapter.current.bind(adapter);
	adapter.current = () => {
		const snapshot = original();
		if (snapshot !== null && typeof snapshot === "object" && snapshot.models !== void 0 && !patched.has(snapshot.models)) {
			patched.add(snapshot.models);
			patchModelsStream(snapshot.models, getMaps, logger);
		}
		return snapshot;
	};
}

/**
 * Patch one pi-ai `Models` collection: `streamSimple`/`stream` gain an
 * `onPayload` injection that rewrites the wire model name per the mapping.
 * The wrapper closes over `getMaps()`, never over a snapshot of it, so
 * mapping edits are picked up on the next request without a re-patch.
 */
function patchModelsStream(models, getMaps, logger) {
	const logged = new Set();
	const wrap = (method) => {
		const original = models[method]?.bind(models);
		if (original === void 0) return;
		models[method] = (model, context, options) => {
			const provider = model?.provider;
			const dshId = model?.id;
			const wireId = provider === void 0 || dshId === void 0 ? void 0 : getMaps().get(provider)?.get(dshId);
			if (wireId === void 0 || wireId === dshId) return original(model, context, options);
			const key = `${provider}/${dshId}`;
			if (!logged.has(key)) {
				logged.add(key);
				logger?.info?.(`dsh-model-alias: ${key} requested as ${wireId} on the wire`);
			}
			const previous = options?.onPayload;
			return original(model, context, {
				...(options ?? {}),
				onPayload: composeOnPayload(wireId, previous)
			});
		};
	};
	wrap("streamSimple");
	wrap("stream");
}

/** The settings namespace schema (built lazily to keep module scope dependency-free). */
function configSchema(z) {
	return z.object({
		providers: z.dict(z.dict(z.string())).default({})
	});
}

/** Write a JSON response with no-store caching. */
function sendJson(res, status, obj) {
	const body = JSON.stringify(obj);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(body);
}

/** Read a small JSON request body; a malformed or interrupted body resolves to `{}`. */
function readBody(req) {
	return new Promise((resolve) => {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
			if (data.length > 1e6) req.destroy();
		});
		req.on("end", () => {
			if (!data) return resolve({});
			try {
				resolve(JSON.parse(data));
			} catch {
				resolve({});
			}
		});
		req.on("error", () => resolve({}));
		// Oversized bodies are destroyed mid-read; settle through close so the
		// handler never hangs on a connection that neither ends nor errors.
		req.on("close", () => resolve({}));
	});
}

export function apply(ctx, config) {
	const require = profileRequire(ctx);
	let installSettingsSection;
	let settingsNamespace;
	let z;
	try {
		({ installSettingsSection, settingsNamespace } = require("@deepseek-ai/dsh-settings"));
		z = require("@deepseek-ai/schemastery");
	} catch (error) {
		ctx.logger.warn(`dsh-model-alias: could not resolve harness packages (${error?.message ?? String(error)}); running in entry-config-only mode (mappings from cordis.patch.yml only, no settings.yaml section)`);
	}

	/** Current configuration source: the settings section when mounted, else the entry config. */
	let current = () => config;
	/** Live mapping table; `arm()` reassigns it, patched wrappers read it per request. */
	let maps = new Map();
	/** One-time unknown-provider diagnostics per configuration generation. */
	let warnedRoutes = new Set();
	const wrapped = new WeakSet();
	const patched = new WeakSet();

	const arm = () => {
		const next = normalizeConfig(current());
		maps = next.map;
		warnedRoutes = new Set();
		if (next.skipped.length > 0) ctx.logger.warn(`dsh-model-alias: ignored invalid mapping entries: ${next.skipped.join("; ")}`);
		for (const registration of ctx.llm.adapters.values()) {
			const adapter = registration?.adapter;
			if (adapter === void 0) continue;
			armAdapter(adapter, () => maps, ctx.logger, wrapped, patched);
			// Force a snapshot through the wrapper so the patch is live even
			// before the first request.
			try {
				adapter.current();
			} catch (error) {
				ctx.logger.warn(`dsh-model-alias: could not arm adapter for provider "${registration.provider.id}": ${error?.message ?? String(error)}`);
			}
		}
		for (const route of maps.keys()) {
			if (!ctx.llm.adapters.has(route)) {
				warnedRoutes.add(route);
				ctx.logger.warn(`dsh-model-alias: provider "${route}" is not registered with any LLM adapter; its mappings will not apply (check the route key)`);
			}
		}
	};

	// Adapter registrations come and go (HMR reloads, route edits): re-arm.
	ctx.on("llm/adapters-updated", arm);

	// Optional settings integration: `dsh-model-alias` section in settings.yaml
	// overrides the entry config while it is mounted.
	if (installSettingsSection !== void 0 && settingsNamespace !== void 0 && z !== void 0) {
		installSettingsSection(ctx, settingsNamespace("dsh-model-alias"), configSchema(z), config, {
			setSource: (source) => {
				current = source;
			},
			onChange: arm
		});
	}

	// Web configuration page: the settings-domain wire RPC only serves an
	// explicit apiproxy allowlist, so a third-party namespace cannot be edited
	// through `settings.describe`/`settings.mutate` from the browser. These
	// Host-owned routes bridge the page to the same settings service the
	// runtime mapping already reads — writes persist to settings.yaml and the
	// settings watch re-arms the mapping on the next request.
	if (settingsNamespace !== void 0 && z !== void 0) {
		ctx.inject(["settings", "webServer"], (sctx) => {
			const settings = sctx.settings;
			const ns = settingsNamespace("dsh-model-alias");

			const readConfig = () => {
				const descriptor = settings.describe({ redactSecrets: true }).find((entry) => entry.ns === ns);
				return {
					ok: true,
					config: {
						mounted: descriptor !== void 0,
						providers: descriptor?.value?.providers ?? {},
						base: descriptor?.base?.providers ?? {},
						user: descriptor?.user?.providers,
						writable: settings.writable !== false,
						revision: descriptor?.revision ?? 0
					}
				};
			};

			sctx.webServer.register({
				kind: "exact",
				path: "/dma/api/config",
				handler: async (req, res) => {
					if (req.method === "GET") return sendJson(res, 200, readConfig());
					if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method not allowed" });
					const body = await readBody(req);
					const providers = body.providers;
					// Only an explicit `null` is the reset (clear the user section so
					// the entry config, or an empty mapping, takes over again). A
					// missing or malformed payload is rejected instead — treating it
					// as a reset would silently wipe the mapping on a bad request.
					if (providers !== null && (typeof providers !== "object" || Array.isArray(providers))) {
						return sendJson(res, 400, { ok: false, code: "rejected", error: "providers must be an object of { route: { dshFacingId: wireId } } or null" });
					}
					const ops = providers === null
						? [{ op: "unset", path: ["providers"] }]
						: [{ op: "set", path: ["providers"], value: providers }];
					try {
						await settings.mutate(ns, ops, typeof body.expectedRevision === "number" ? body.expectedRevision : void 0);
					} catch (error) {
						if (error?.code === "SETTINGS_CONFLICT") return sendJson(res, 409, { ok: false, code: "conflict", error: error.message });
						return sendJson(res, 400, { ok: false, code: "rejected", error: error?.message ?? String(error) });
					}
					return sendJson(res, 200, readConfig());
				}
			});
		});
	}

	arm();
}
