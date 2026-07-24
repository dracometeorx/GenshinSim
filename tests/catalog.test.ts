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
    [
      "mistsplitter",
      "homa",
      "engulfing",
      "the-catch",
      "deathmatch",
      "dragons-bane",
      "favonius-lance",
      "dreams",
      "custom",
    ],
  );
  assert.equal(new Set(weapons.map(({ id }) => id)).size, weapons.length);
  assert.deepEqual(
    weapons.map(({ weaponType }) => weaponType),
    [
      "sword",
      "polearm",
      "polearm",
      "polearm",
      "polearm",
      "polearm",
      "polearm",
      "catalyst",
      "any",
    ],
  );
  assert.ok(
    weapons
      .filter(({ id }) => id !== "custom")
      .every(({ passive }) => passive.refinementDescriptions?.length === 5),
  );
});

test("keeps constellation and team buff definitions catalog-owned", () => {
  for (const character of characters) {
    const constellationLevels = (
      character.constellations ?? []
    ).map(({ level }) => level);
    assert.equal(
      new Set(constellationLevels).size,
      constellationLevels.length,
    );
    assert.ok(
      constellationLevels.every(
        (level) => level >= 1 && level <= 6,
      ),
    );
    const teamBuffIds = (character.teamBuffs ?? []).map(
      ({ id }) => id,
    );
    assert.equal(new Set(teamBuffIds).size, teamBuffIds.length);
  }
});

test("uses the level-90 stats for the newly supported polearms", () => {
  assert.deepEqual(
    weapons
      .filter(({ id }) =>
        [
          "the-catch",
          "deathmatch",
          "dragons-bane",
          "favonius-lance",
        ].includes(id),
      )
      .map(
        ({
          id,
          level,
          baseAtk,
          secondaryStat,
          secondaryValue,
        }) => ({
          id,
          level,
          baseAtk,
          secondaryStat,
          secondaryValue,
        }),
      ),
    [
      {
        id: "the-catch",
        level: 90,
        baseAtk: 510,
        secondaryStat: "energyRecharge",
        secondaryValue: 45.9,
      },
      {
        id: "deathmatch",
        level: 90,
        baseAtk: 454,
        secondaryStat: "critRate",
        secondaryValue: 36.8,
      },
      {
        id: "dragons-bane",
        level: 90,
        baseAtk: 454,
        secondaryStat: "elementalMastery",
        secondaryValue: 221,
      },
      {
        id: "favonius-lance",
        level: 90,
        baseAtk: 565,
        secondaryStat: "energyRecharge",
        secondaryValue: 30.6,
      },
    ],
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
    [
      "homa",
      "engulfing",
      "the-catch",
      "deathmatch",
      "dragons-bane",
      "favonius-lance",
      "custom",
    ],
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
      "shimenawa",
      "emblem",
      "deepwood",
    ],
  );
  assert.equal(
    new Set(artifactSets.map(({ id }) => id)).size,
    artifactSets.length,
  );
});
