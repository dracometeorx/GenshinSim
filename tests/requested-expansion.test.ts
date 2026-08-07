import assert from "node:assert/strict";
import test from "node:test";

import { calculateBuild } from "../lib/calculation.ts";
import type { BuildInput } from "../lib/calculator.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import {
  getArtifactSet,
  resolveArtifactModifiers,
} from "../lib/data/artifacts/index.ts";
import { characters } from "../lib/data/characters/index.ts";
import { getDamageSelectionsForCharacter } from "../lib/damage.ts";
import { weapons } from "../lib/data/weapons/index.ts";

const emptyArtifact: BuildInput["artifact"] = {
  flatHp: 0,
  flatAtk: 0,
  flatDef: 0,
  critRate: 0,
  critDmg: 0,
  energyRecharge: 0,
  elementalMastery: 0,
  elementalDmg: 0,
  healingBonus: 0,
};

function character(id: string) {
  const preset = characters.find((candidate) => candidate.id === id);
  assert.ok(preset, id);
  return preset;
}

function weapon(id: string) {
  const preset = weapons.find((candidate) => candidate.id === id);
  assert.ok(preset, id);
  return preset;
}

function calculate(
  characterId: string,
  options: {
    constellation?: number;
    selections?: Record<string, string>;
    artifact?: Partial<BuildInput["artifact"]>;
    weaponId?: string;
    weaponRefinement?: number;
    weaponSelections?: Record<string, string>;
  } = {},
) {
  const characterPreset = character(characterId);
  const weaponPreset = weapon(
    options.weaponId ?? characterPreset.defaultWeaponId,
  );
  const build: BuildInput = {
    character: characterPreset,
    element: characterPreset.element,
    weapon: {
      ...weaponPreset,
      refinement: options.weaponRefinement ?? 1,
    },
    weaponPassiveSelections: options.weaponSelections ?? {},
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
    artifact: { ...emptyArtifact, ...options.artifact },
    talentBonuses: {
      normal: 0,
      charged: 0,
      plunge: 0,
      skill: 0,
      burst: 0,
    },
  };
  return calculateBuild({
    build,
    character: characterPreset,
    weapon: { ...weaponPreset, refinement: build.weapon.refinement },
    artifactSet: getArtifactSet("none"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        ...getDamageSelectionsForCharacter(characterPreset),
        ...options.selections,
      },
    },
    constellation: options.constellation,
  });
}

test("adds the six requested characters with fixed representative damage", () => {
  const expected = [
    ["yelan", 14450, 244, 548, "yelan-exquisite-throw"],
    ["xingqiu", 10222, 202, 758, "xingqiu-rain-sword"],
    ["arlecchino", 13103, 342, 765, "arlecchino-masque-normal"],
    ["mavuika", 12552, 359, 792, "mavuika-sunfell-slice"],
    ["skirk", 12417, 359, 806, "skirk-burst"],
    ["chiori", 11438, 323, 953, "chiori-tamoto"],
  ] as const;

  for (const [id, baseHp, baseAtk, baseDef, skillId] of expected) {
    const preset = character(id);
    const result = calculate(id);
    assert.deepEqual(
      [preset.baseHp, preset.baseAtk, preset.baseDef],
      [baseHp, baseAtk, baseDef],
    );
    assert.equal(result.selectedSkill?.id, skillId);
    assert.ok((result.selectedSkill?.variants[0]?.nonCrit ?? 0) > 0);
  }
});

test("breaks multi-hit representative damage into segments that sum to the total", () => {
  const cases = [
    ["ayaka", 20],
    ["yelan", 3],
    ["skirk", 6],
    ["nefer", 3],
    ["diona", 5],
    ["venti", 20],
    ["varka", 2],
    ["lohen", 4],
  ] as const;

  for (const [characterId, segmentCount] of cases) {
    const skill = calculate(characterId).selectedSkill;
    assert.ok(skill, characterId);
    assert.equal(skill.segments?.length, segmentCount, characterId);

    for (const [variantIndex, total] of skill.variants.entries()) {
      const segmentVariants = skill.segments!.map(
        (segment) => segment.variants[variantIndex],
      );
      assert.equal(
        segmentVariants.reduce(
          (sum, variant) => sum + variant.nonCrit,
          0,
        ),
        total.nonCrit,
        `${characterId} non-crit`,
      );
      assert.equal(
        segmentVariants.reduce((sum, variant) => sum + variant.crit, 0),
        total.crit,
        `${characterId} crit`,
      );
      assert.equal(
        segmentVariants.reduce(
          (sum, variant) => sum + variant.expected,
          0,
        ),
        total.expected,
        `${characterId} expected`,
      );
    }
  }

  assert.equal(calculate("xingqiu").selectedSkill?.segments, undefined);
  assert.equal(
    calculate("columbina", {
      selections: { columbinaInterference: "lunarBloom" },
    }).selectedSkill?.segments?.length,
    5,
  );
});

test("adds Kokomi, Escoffier, and Charlotte with fixed representative damage", () => {
  const expected = [
    ["kokomi", 13471, 234, 657, "kokomi-ceremonial-normal-third"],
    ["escoffier", 13348, 347, 732, "escoffier-frosty-parfait"],
    ["charlotte", 10766, 173, 546, "charlotte-hold-photo"],
  ] as const;

  for (const [id, baseHp, baseAtk, baseDef, skillId] of expected) {
    const preset = character(id);
    const result = calculate(id);
    assert.deepEqual(
      [preset.baseHp, preset.baseAtk, preset.baseDef],
      [baseHp, baseAtk, baseDef],
    );
    assert.equal(result.selectedSkill?.id, skillId);
    assert.ok((result.selectedSkill?.variants[0]?.nonCrit ?? 0) > 0);
    assert.equal(preset.constellations?.length, 6);
  }
});

test("applies Kokomi and Charlotte character mechanics", () => {
  const kokomiBase = calculate("kokomi");
  const kokomiHp = calculate("kokomi", {
    artifact: { flatHp: 10000 },
  });
  const charlotteC5 = calculate("charlotte", { constellation: 5 });
  const charlotteC6 = calculate("charlotte", { constellation: 6 });

  assert.equal(kokomiBase.panel.critRate, -95);
  assert.equal(kokomiBase.panel.healingBonus, 25);
  assert.ok(
    kokomiHp.selectedSkill!.variants[0].nonCrit >
      kokomiBase.selectedSkill!.variants[0].nonCrit,
  );
  assert.equal(
    charlotteC6.skills.some(
      (skill) => skill.id === "charlotte-c6-coordinated",
    ),
    true,
  );
  assert.ok(
    charlotteC5.selectedSkill!.variants[0].nonCrit >
      calculate("charlotte", { constellation: 4 }).selectedSkill!
        .variants[0].nonCrit,
  );
});

test("scales the requested characters' representative mechanics", () => {
  const arlecchinoLow = calculate("arlecchino", {
    selections: { arlecchinoBondOfLife: "65" },
  });
  const arlecchinoHigh = calculate("arlecchino", {
    selections: { arlecchinoBondOfLife: "130" },
  });
  assert.ok(
    arlecchinoHigh.selectedSkill!.variants[0].nonCrit >
      arlecchinoLow.selectedSkill!.variants[0].nonCrit,
  );

  const mavuikaLow = calculate("mavuika", {
    selections: {
      mavuikaFightingSpirit: "0",
      mavuikaNightsoulBurst: "inactive",
    },
  });
  const mavuikaHigh = calculate("mavuika", {
    selections: {
      mavuikaFightingSpirit: "200",
      mavuikaNightsoulBurst: "inactive",
    },
  });
  assert.ok(
    mavuikaHigh.selectedSkill!.variants[0].nonCrit >
      mavuikaLow.selectedSkill!.variants[0].nonCrit,
  );

  const skirkLow = calculate("skirk", {
    selections: {
      skirkSerpentsSubtlety: "50",
      skirkVoidRifts: "0",
      skirkDeadRiverStacks: "0",
    },
  });
  const skirkHigh = calculate("skirk", {
    selections: {
      skirkSerpentsSubtlety: "100",
      skirkVoidRifts: "3",
      skirkDeadRiverStacks: "3",
    },
  });
  assert.ok(
    skirkHigh.selectedSkill!.variants[0].nonCrit >
      skirkLow.selectedSkill!.variants[0].nonCrit,
  );

  const chioriBase = calculate("chiori");
  const chioriDefense = calculate("chiori", {
    artifact: { flatDef: 1000 },
  });
  assert.ok(
    chioriDefense.selectedSkill!.variants[0].nonCrit >
      chioriBase.selectedSkill!.variants[0].nonCrit,
  );

  assert.equal(calculate("xingqiu").effectiveResistance, 10);
  assert.equal(
    calculate("xingqiu", { constellation: 2 }).effectiveResistance,
    -5,
  );
});

test("applies all four requested artifact set states", () => {
  const obsidian = resolveArtifactModifiers(
    getArtifactSet("obsidian-codex"),
    4,
    { obsidianCodexState: "active" },
    true,
  );
  assert.ok(
    obsidian.some(
      (modifier) =>
        modifier.kind === "damageBonus" && modifier.value === 15,
    ),
  );
  assert.ok(
    obsidian.some(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "critRate" &&
        modifier.value === 40,
    ),
  );

  const whimsy = resolveArtifactModifiers(
    getArtifactSet("fragment-of-harmonic-whimsy"),
    4,
    { harmonicWhimsyStacks: "3" },
    true,
  );
  assert.ok(
    whimsy.some(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "atkPct" &&
        modifier.value === 18,
    ),
  );
  assert.ok(
    whimsy.some(
      (modifier) =>
        modifier.kind === "damageBonus" && modifier.value === 54,
    ),
  );

  const marechaussee = resolveArtifactModifiers(
    getArtifactSet("marechaussee-hunter"),
    4,
    { marechausseeHunterStacks: "3" },
    true,
  );
  assert.ok(
    marechaussee.some(
      (modifier) =>
        modifier.kind === "damageBonus" &&
        modifier.category === "normal" &&
        modifier.value === 15,
    ),
  );
  assert.ok(
    marechaussee.some(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "critRate" &&
        modifier.value === 36,
    ),
  );

  const deepGalleries = resolveArtifactModifiers(
    getArtifactSet("finale-of-the-deep-galleries"),
    4,
    { deepGalleriesState: "both" },
    true,
  );
  assert.ok(
    deepGalleries.some(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "elementalDmg" &&
        modifier.element === "cryo" &&
        modifier.value === 15,
    ),
  );
  assert.deepEqual(
    deepGalleries
      .filter(
        (modifier) =>
          modifier.kind === "damageBonus" && modifier.value === 60,
      )
      .map((modifier) =>
        modifier.kind === "damageBonus" ? modifier.category : undefined,
      ),
    ["normal", "burst"],
  );
});

test("scales A Thousand Blazing Suns through every refinement and Nightsoul", () => {
  const attackBonuses = [28, 35, 42, 49, 56];
  const critBonuses = [20, 25, 30, 35, 40];
  for (let refinement = 1; refinement <= 5; refinement += 1) {
    const inactive = calculate("mavuika", {
      weaponId: "a-thousand-blazing-suns",
      weaponRefinement: refinement,
      weaponSelections: { blazingSunsState: "inactive" },
      selections: { mavuikaNightsoulBurst: "inactive" },
    });
    const scorching = calculate("mavuika", {
      weaponId: "a-thousand-blazing-suns",
      weaponRefinement: refinement,
      weaponSelections: { blazingSunsState: "scorching" },
      selections: { mavuikaNightsoulBurst: "inactive" },
    });
    const nightsoul = calculate("mavuika", {
      weaponId: "a-thousand-blazing-suns",
      weaponRefinement: refinement,
      weaponSelections: { blazingSunsState: "nightsoul" },
      selections: { mavuikaNightsoulBurst: "inactive" },
    });
    const baseAtk = 359 + 741;
    assert.ok(
      Math.abs(
        scorching.panel.atk -
          inactive.panel.atk -
          baseAtk * (attackBonuses[refinement - 1] / 100),
      ) <= 1,
    );
    assert.ok(
      Math.abs(
        nightsoul.panel.atk -
          inactive.panel.atk -
          baseAtk * ((attackBonuses[refinement - 1] * 1.75) / 100),
      ) <= 1,
    );
    const scorchingVariant = scorching.selectedSkill!.variants[0];
    const nightsoulVariant = nightsoul.selectedSkill!.variants[0];
    const scorchingCritDmg =
      (scorchingVariant.crit / scorchingVariant.nonCrit - 1) * 100;
    const nightsoulCritDmg =
      (nightsoulVariant.crit / nightsoulVariant.nonCrit - 1) * 100;
    assert.ok(
      Math.abs(
        nightsoulCritDmg - scorchingCritDmg -
          critBonuses[refinement - 1] * 0.75,
      ) < 0.05,
    );
  }
});
