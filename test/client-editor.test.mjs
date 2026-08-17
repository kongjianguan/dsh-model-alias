/**
 * Unit tests for lib/client-editor.js — the mapping-table editor model that
 * the browser settings section (lib/client.js) inlines.
 */
import assert from "node:assert/strict";
import { flattenProviders, groupRows, providersEqual } from "../lib/client-editor.js";

let passed = 0;
function test(label, fn) {
	fn();
	passed++;
	console.log(`ok - ${label}`);
}

test("flattenProviders: nested mapping becomes sorted rows", () => {
	const rows = flattenProviders({
		"z-route": { "b-model": "wire-b", "a-model": "wire-a" },
		"a-route": { "only": "wire" }
	});
	assert.deepEqual(rows, [
		{ route: "a-route", dshId: "only", wireId: "wire" },
		{ route: "z-route", dshId: "a-model", wireId: "wire-a" },
		{ route: "z-route", dshId: "b-model", wireId: "wire-b" }
	]);
});

test("flattenProviders: skips non-object model tables and non-mapping inputs", () => {
	assert.deepEqual(flattenProviders({ ok: { a: "b" }, bad: "nope", worse: [] }), [{ route: "ok", dshId: "a", wireId: "b" }]);
	for (const raw of [undefined, null, 42, "x", []]) assert.deepEqual(flattenProviders(raw), []);
});

test("groupRows: trims cells and groups by route", () => {
	const { value, invalid } = groupRows([
		{ route: " r1 ", dshId: " m1 ", wireId: " w1 " },
		{ route: "r1", dshId: "m2", wireId: "w2" }
	]);
	assert.deepEqual(invalid, []);
	assert.deepEqual(value, { r1: { m1: "w1", m2: "w2" } });
});

test("groupRows: blank cells and duplicate keys are invalid", () => {
	const { value, invalid } = groupRows([
		{ route: "", dshId: "m", wireId: "w" },
		{ route: "r", dshId: "", wireId: "w" },
		{ route: "r", dshId: "m", wireId: "" },
		{ route: "r", dshId: "m", wireId: "first" },
		{ route: "r", dshId: "m", wireId: "second" },
		{ route: "r2", dshId: "ok", wireId: "fine" }
	]);
	assert.deepEqual(invalid, [0, 1, 2, 4]);
	assert.deepEqual(value, { r: { m: "first" }, r2: { ok: "fine" } });
});

test("groupRows ↔ flattenProviders round-trip", () => {
	const providers = { r1: { a: "wa", b: "wb" }, r2: { c: "wc" } };
	const rows = flattenProviders(providers);
	const { value, invalid } = groupRows(rows);
	assert.deepEqual(invalid, []);
	assert.deepEqual(value, providers);
});

test("providersEqual: presence and content", () => {
	assert.equal(providersEqual(undefined, undefined), true);
	assert.equal(providersEqual({ a: "1" }, { a: "1" }), true);
	assert.equal(providersEqual({ a: "1" }, { a: "2" }), false);
	assert.equal(providersEqual({ a: "1" }, { a: "1", b: "2" }), false);
	assert.equal(providersEqual({ a: "1" }, undefined), false);
	assert.equal(providersEqual(null, {}), false);
	assert.equal(providersEqual({ a: 1 }, { a: 1 }), false, "non-string values are unequal");
});
