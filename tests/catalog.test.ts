import assert from "node:assert/strict";
import test from "node:test";

import type { BuildInput } from "../lib/calculator.ts";
import { calculateFinalPanel } from "../lib/calculator.ts";
import {
  calculateRepresentativeDamage,
  defaultDamageSettings,
} from "../lib/damage.ts";
import { artifactSets } from "../lib/data/artifacts/index.ts";
import { characters } from "../lib/data/characters/index.ts";
import {
  getRepresentativeSkillCharacterIds,
  getRepresentativeSkillId,
} from "../lib/data/characters/representative-skills.ts";
import {
  getCompatibleWeapons,
  isWeaponCompatible,
  weapons,
} from "../lib/data/weapons/index.ts";
import { hpStateOptions } from "../lib/data/common.ts";

test("exports every character preset with a unique id", () => {
  assert.deepEqual(
    characters.map(({ id }) => id),
    [
      "ayaka",
      "hutao",
      "raiden",
      "nahida",
      "xilonen",
      "citlali",
      "zhongli",
      "furina",
      "columbina",
      "flins",
      "ineffa",
      "lauma",
      "nefer",
      "linnea",
      "zibai",
      "sandrone",
      "qiqi",
      "yae-miko",
      "wriothesley",
      "cyno",
      "beidou",
      "diona",
      "durin",
      "venti",
      "klee",
      "albedo",
      "mona",
      "fischl",
      "sucrose",
      "razor",
      "varka",
      "prune",
      "nicole",
      "lohen",
      "custom",
    ],
  );
  assert.equal(new Set(characters.map(({ id }) => id)).size, characters.length);
  assert.deepEqual(
    characters
      .filter(({ id }) => id !== "custom")
      .map(({ damageProfile }) => damageProfile?.kind),
    [
      "ayaka",
      "hutao",
      "raiden",
      "nahida",
      "xilonen",
      "citlali",
      "zhongli",
      "furina",
      "columbina",
      "flins",
      "ineffa",
      "lauma",
      "nefer",
      "linnea",
      "zibai",
      "sandrone",
      "qiqi",
      "yae-miko",
      "wriothesley",
      "cyno",
      "beidou",
      "diona",
      "durin",
      "venti",
      "klee",
      "albedo",
      "mona",
      "fischl",
      "sucrose",
      "razor",
      "varka",
      "prune",
      "nicole",
      "lohen",
    ],
  );
  assert.deepEqual(
    characters.map(({ weaponType }) => weaponType),
    [
      "sword",
      "polearm",
      "polearm",
      "catalyst",
      "sword",
      "catalyst",
      "polearm",
      "sword",
      "catalyst",
      "polearm",
      "polearm",
      "catalyst",
      "catalyst",
      "bow",
      "sword",
      "claymore",
      "sword",
      "catalyst",
      "catalyst",
      "polearm",
      "claymore",
      "bow",
      "sword",
      "bow",
      "catalyst",
      "sword",
      "catalyst",
      "bow",
      "catalyst",
      "claymore",
      "claymore",
      "catalyst",
      "catalyst",
      "polearm",
      "any",
    ],
  );
});

test("defines one fixed representative skill for every combat character", () => {
  assert.deepEqual(
    [...getRepresentativeSkillCharacterIds()].sort(),
    characters
      .filter((character) => character.damageProfile)
      .map((character) => character.id)
      .sort(),
  );

  for (const character of characters.filter(
    (candidate) => candidate.damageProfile,
  )) {
    const weapon =
      weapons.find(
        (candidate) => candidate.id === character.defaultWeaponId,
      ) ?? weapons[0];
    const build: BuildInput = {
      element: character.element,
      character,
      weapon,
      artifactSetId: "none",
      artifactSetPieces: 0,
      artifactSetSelections: {},
      artifact: {
        flatHp: 0,
        flatAtk: 0,
        flatDef: 0,
        critRate: 0,
        critDmg: 0,
        energyRecharge: 0,
        elementalMastery: 0,
        elementalDmg: 0,
        healingBonus: 0,
      },
      talentBonuses: {
        skill: 0,
        burst: 0,
        normal: 0,
        charged: 0,
        plunge: 0,
      },
    };
    const result = calculateRepresentativeDamage(
      character,
      build,
      calculateFinalPanel(build),
      defaultDamageSettings,
      [],
      [],
      0,
      "ascendant",
      true,
      true,
      12,
    );

    assert.equal(
      result.selectedSkill?.id,
      getRepresentativeSkillId(character.id),
      character.id,
    );
  }
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
      "fractured-halo",
      "bloodsoaked-ruins",
      "nightweavers-looking-glass",
      "reliquary-of-truth",
      "nocturnes-curtain-call",
      "lightbearing-moonshard",
      "frostbound-oath",
      "ballad-of-the-fjords",
      "tamayuratei-no-ohanashi",
      "prospectors-shovel",
      "calamity-queller",
      "missive-windspear",
      "lost-prayer",
      "dawning-frost",
      "etherlight-spindlelute",
      "wandering-evenstar",
      "sacrificial-jade",
      "oathsworn-eye",
      "sacrificial-fragments",
      "the-widsith",
      "solar-pearl",
      "prototype-amber",
      "thrilling-tales",
      "azurelight",
      "splendor-of-tranquil-waters",
      "skyward-blade",
      "wolf-fang",
      "the-black-sword",
      "the-dockhands-assistant",
      "xiphos-moonlight",
      "calamity-of-eshu",
      "favonius-sword",
      "cinnabar-spindle",
      "slingshot",
      "favonius-warbow",
      "skyward-harp",
      "the-first-great-magic",
      "amos-bow",
      "the-stringless",
      "rust",
      "the-viridescent-hunt",
      "wolfs-gravestone",
      "skyward-pride",
      "ultimate-overlords-mega-magic-sword",
      "makhaira-aquamarine",
      "talking-stick",
      "tidal-shadow",
      "serpent-spine",
      "a-teaspoon-of-transcendence",
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
      "polearm",
      "polearm",
      "catalyst",
      "catalyst",
      "catalyst",
      "sword",
      "bow",
      "polearm",
      "polearm",
      "polearm",
      "polearm",
      "polearm",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "catalyst",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "sword",
      "bow",
      "bow",
      "bow",
      "bow",
      "bow",
      "bow",
      "bow",
      "bow",
      "claymore",
      "claymore",
      "claymore",
      "claymore",
      "claymore",
      "claymore",
      "claymore",
      "claymore",
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
  const ayakaWeapons = getCompatibleWeapons(ayaka.weaponType);
  const hutaoWeapons = getCompatibleWeapons(hutao.weaponType);

  assert.ok(
    ayakaWeapons.every(
      ({ weaponType }) => weaponType === "sword" || weaponType === "any",
    ),
  );
  assert.ok(
    hutaoWeapons.every(
      ({ weaponType }) => weaponType === "polearm" || weaponType === "any",
    ),
  );
  assert.ok(ayakaWeapons.some(({ id }) => id === "azurelight"));
  assert.ok(ayakaWeapons.some(({ id }) => id === "favonius-sword"));
  assert.ok(hutaoWeapons.some(({ id }) => id === "calamity-queller"));
  assert.ok(hutaoWeapons.some(({ id }) => id === "ballad-of-the-fjords"));
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
      "golden-troupe",
      "gilded-dreams",
      "deepwood",
      "silken-moons-serenade",
      "night-of-skys-unveiling",
      "aubade-of-morningstar-and-moon",
      "a-day-carved-from-rising-winds",
      "celestial-gift",
      "viridescent-venerer",
      "tenacity-of-the-millelith",
      "noblesse-oblige",
      "instructor",
      "archaic-petra",
      "scroll-of-the-hero-of-cinder-city",
      "song-of-days-past",
      "maiden-beloved",
      "the-exile",
      "scholar",
      "delusion-of-immolated-shadow",
    ],
  );
  assert.equal(
    new Set(artifactSets.map(({ id }) => id)).size,
    artifactSets.length,
  );
});
