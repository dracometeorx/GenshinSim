import assert from "node:assert/strict";
import test from "node:test";

import { characters } from "../lib/data/characters/index.ts";
import { weapons } from "../lib/data/weapons/index.ts";

test("exports every character preset with a unique id", () => {
  assert.deepEqual(
    characters.map(({ id }) => id),
    ["ayaka", "hutao", "raiden", "nahida", "custom"],
  );
  assert.equal(new Set(characters.map(({ id }) => id)).size, characters.length);
});

test("exports every weapon preset with a unique id", () => {
  assert.deepEqual(
    weapons.map(({ id }) => id),
    ["mistsplitter", "homa", "engulfing", "dreams", "custom"],
  );
  assert.equal(new Set(weapons.map(({ id }) => id)).size, weapons.length);
});
