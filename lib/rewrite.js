/**
 * dsh-model-alias — pure rewrite helpers (no cordis dependency).
 *
 * The mapping config is provider-scoped:
 *
 * ```yaml
 * dsh-model-alias:
 *   providers:
 *     token-rhythm:
 *       deepseek-v4-flash: deepseek-v4-flash-0731   # DSH-facing id -> wire id
 * ```
 *
 * pi-ai exposes `options.onPayload(payload, model)` on every protocol: it is
 * invoked with the exact request body right before the HTTP request is sent,
 * and its return value replaces that body. This module builds the payload
 * rewrite used inside that hook and normalizes the settings shape above into
 * lookup tables.
 */

/**
 * Normalize the raw settings shape
 * `{ providers: { <route>: { <dshFacingId>: <wireId> } } }` into
 * `Map<route, Map<dshFacingId, wireId>>`.
 *
 * Entries that are not non-empty strings are dropped and reported so the
 * caller can warn instead of silently ignoring a typo. A mapping whose wire
 * id equals its dsh-facing id is kept (a harmless no-op) so the configuration
 * round-trips visibly.
 *
 * @param raw - the resolved settings value for this namespace.
 * @returns `{ map, skipped }` — the lookup tables and the dropped entries.
 */
export function normalizeConfig(raw) {
	const skipped = [];
	const map = new Map();
	const providers = raw && typeof raw === "object" && !Array.isArray(raw) ? raw.providers : void 0;
	if (providers === void 0 || typeof providers !== "object" || providers === null || Array.isArray(providers)) return { map, skipped };
	for (const [route, models] of Object.entries(providers)) {
		if (typeof route !== "string" || route.length === 0) {
			skipped.push(`provider with an empty route key`);
			continue;
		}
		if (typeof models !== "object" || models === null || Array.isArray(models)) {
			skipped.push(`provider "${route}": mapping must be an object of { dshFacingId: wireId }`);
			continue;
		}
		const entries = new Map();
		for (const [dshId, wireId] of Object.entries(models)) {
			if (typeof dshId !== "string" || dshId.length === 0) {
				skipped.push(`provider "${route}": empty dsh-facing model id`);
				continue;
			}
			if (typeof wireId !== "string" || wireId.length === 0) {
				skipped.push(`provider "${route}" model "${dshId}": wire id must be a non-empty string`);
				continue;
			}
			entries.set(dshId, wireId);
		}
		if (entries.size > 0) map.set(route, entries);
		else skipped.push(`provider "${route}": no usable model mappings`);
	}
	return { map, skipped };
}

/**
 * Rewrite the model field of one provider payload.
 *
 * pi-ai hands `onPayload` the request body it is about to send; the model is
 * named `model` on OpenAI-completions, OpenAI-responses, and
 * Anthropic-messages, and `modelId` on Bedrock converse. The rewrite spreads
 * the original payload so every other field is preserved verbatim.
 *
 * @param payload - the request body pi-ai built.
 * @param wireId - the model name the provider actually serves.
 * @returns the rewritten body, or `undefined` when the payload shape is not
 *   rewriteable (leave the request untouched).
 */
export function rewritePayload(payload, wireId) {
	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return void 0;
	if (typeof payload.model === "string") return { ...payload, model: wireId };
	if (typeof payload.modelId === "string") return { ...payload, modelId: wireId };
	return void 0;
}

/**
 * Build the `onPayload` callback for one request.
 *
 * pi-ai calls `onPayload(payload, model)` and uses the return value when it
 * is not `undefined`. A previous hook (from another plugin) is composed first
 * so both rewrites apply; our rewrite is applied to whatever it produced.
 *
 * @param wireId - the model name the provider actually serves.
 * @param previous - a hook already present on the stream options, if any.
 * @returns the composed hook.
 */
export function composeOnPayload(wireId, previous) {
	if (previous === void 0) return (payload) => rewritePayload(payload, wireId);
	return async (payload, model) => {
		const base = await previous(payload, model);
		const target = base === void 0 ? payload : base;
		return rewritePayload(target, wireId) ?? target;
	};
}
