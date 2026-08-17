/**
 * dsh-model-alias — mapping-table editor model (pure, dependency-free).
 *
 * The browser settings section edits the `dsh-model-alias` settings namespace,
 * whose shape is `{ providers: { <route>: { <dshFacingId>: <wireId> } } }`.
 * This module is the canonical, unit-tested core of that editor: flattening
 * the nested mapping into table rows, grouping rows back into the stored
 * shape, and comparing two mappings. The Host route owns the actual write.
 *
 * The shipped browser bundle (`lib/client.js`) inlines an equivalent copy —
 * the client module loader resolves entry ids, not subpath exports, so a
 * third-party bundle cannot `require` this file. Keep the two in sync; the
 * tests here pin down the semantics that copy must reproduce.
 */

/**
 * Flatten a providers object into row objects, sorted by route then model id.
 * Entries with non-object model tables are skipped defensively.
 *
 * @param providers - the `providers` field of a resolved settings value.
 * @returns `[{ route, dshId, wireId }, ...]` in a stable order.
 */
export function flattenProviders(providers) {
	const rows = [];
	if (providers !== null && typeof providers === "object" && !Array.isArray(providers)) {
		for (const [route, models] of Object.entries(providers)) {
			if (models === null || typeof models !== "object" || Array.isArray(models)) continue;
			for (const [dshId, wireId] of Object.entries(models)) rows.push({ route, dshId, wireId });
		}
	}
	return rows.sort((a, b) => {
		const byRoute = a.route < b.route ? -1 : a.route > b.route ? 1 : 0;
		if (byRoute !== 0) return byRoute;
		return a.dshId < b.dshId ? -1 : a.dshId > b.dshId ? 1 : 0;
	});
}

/**
 * Group table rows back into the stored `providers` shape. Blank cells are
 * trimmed; a row with any blank cell is invalid (reported by its index). Two
 * rows resolving to the same provider/model key are invalid too — a save
 * would otherwise silently keep one.
 *
 * @param rows - the current table rows.
 * @returns `{ value, invalid }` — the grouped mapping and the invalid row indices.
 */
export function groupRows(rows) {
	const invalid = [];
	const value = {};
	for (let index = 0; index < rows.length; index++) {
		const route = String(rows[index].route ?? "").trim();
		const dshId = String(rows[index].dshId ?? "").trim();
		const wireId = String(rows[index].wireId ?? "").trim();
		if (route === "" || dshId === "" || wireId === "") {
			invalid.push(index);
			continue;
		}
		if (value[route] === void 0) value[route] = {};
		if (Object.prototype.hasOwnProperty.call(value[route], dshId)) {
			invalid.push(index);
			continue;
		}
		value[route][dshId] = wireId;
	}
	return { value, invalid };
}

/**
 * Structural equality for plain-object mappings (`{ id: name }` tables).
 * Used to skip no-op writes and to decide whether a table changed.
 *
 * @param a - one mapping.
 * @param b - the other mapping.
 * @returns whether both are absent or carry the same string entries.
 */
export function providersEqual(a, b) {
	if (a === void 0 && b === void 0) return true;
	if (a === null || typeof a !== "object" || Array.isArray(a)) return false;
	if (b === null || typeof b !== "object" || Array.isArray(b)) return false;
	const leftKeys = Object.keys(a);
	const rightKeys = Object.keys(b);
	if (leftKeys.length !== rightKeys.length) return false;
	for (const key of leftKeys) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
		const lv = a[key];
		const rv = b[key];
		if (typeof lv !== "string" || typeof rv !== "string" || lv !== rv) return false;
	}
	return true;
}
