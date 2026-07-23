import assert from "node:assert/strict";
import test from "node:test";

import { artifactSets } from "../lib/data/artifacts/index.ts";
import { characters } from "../lib/data/characters/index.ts";
import {
  getCompatibleWeapons,
  isWeaponCompatible,
  weapons,
} from "../lib/data/weapons/index.ts";
import { hpStateOptions } from "../lib/data/common.ts";

test("exports every character preset with a unique id", () => {
  assert.deepEqual(
    characters.map(({ id }) => id),
    ["ayaka", "hutao", "raiden", "nahida", "custom"],
  );
  assert.equal(new Set(characters.map(({ id }) => id)).size, characters.length);
  assert.deepEqual(
    characters
      .filter(({ id }) => id !== "custom")
      .map(({ damageProfile }) => damageProfile?.kind),
    ["ayaka", "hutao", "raiden", "nahida"],
  );
  assert.deepEqual(
    characters.map(({ weaponType }) => weaponType),
    ["sword", "polearm", "polearm", "catalyst", "any"],
  );
});

test("exports every weapon preset with a unique id", () => {
  assert.deepEqual(
    weapons.map(({ id }) => id),
    ["mistsplitter", "homa", "engulfing", "dreams", "custom"],
  );
  assert.equal(new Set(weapons.map(({ id }) => id)).size, weapons.length);
  assert.deepEqual(
    weapons.map(({ weaponType }) => weaponType),
    ["sword", "polearm", "polearm", "catalyst", "any"],
  );
});

test("only exposes weapons compatible with each character", () => {
  const ayaka = characters.find(({ id }) => id === "ayaka");
  const hutao = characters.find(({ id }) => id === "hutao");
  const mistsplitter = weapons.find(({ id }) => id === "mistsplitter");

  assert.ok(ayaka);
  assert.ok(hutao);
  assert.ok(mistsplitter);
  assert.deepEqual(
    getCompatibleWeapons(ayaka.weaponType).map(({ id }) => id),
    ["mistsplitter", "custom"],
  );
  assert.deepEqual(
    getCompatibleWeapons(hutao.weaponType).map(({ id }) => id),
    ["homa", "engulfing", "custom"],
  );
  assert.equal(
    isWeaponCompatible(hutao.weaponType, mistsplitter),
    false,
  );
});

test("uses the same HP-state labels for Hu Tao and Staff of Homa", () => {
  const hutao = characters.find(({ id }) => id === "hutao");
  const homa = weapons.find(({ id }) => id === "homa");
  const hutaoControl = hutao?.damageProfile?.controls.find(
    ({ key }) => key === "hutaoHpState",
  );

  assert.deepEqual(hutaoControl?.options, hpStateOptions);
  assert.deepEqual(homa?.passive.control?.options, hpStateOptions);
});

test("exports every artifact set preset with a unique id", () => {
  assert.deepEqual(
    artifactSets.map(({ id }) => id),
    [
      "none",
      "blizzard-strayer",
      "crimson-witch",
      "emblem",
      "deepwood",
    ],
  );
  assert.equal(
    new Set(artifactSets.map(({ id }) => id)).size,
    artifactSets.length,
  );
});
