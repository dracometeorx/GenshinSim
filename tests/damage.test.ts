import assert from "node:assert/strict";
import test from "node:test";

import type { BuildInput, FinalPanel } from "../lib/calculator.ts";
import {
  calculateDefenseMultiplier,
  calculateRepresentativeDamage as calculateResolvedDamage,
  calculateResistanceMultiplier,
  calculateSpreadBonus,
  defaultDamageSettings,
  getReactionLevelMultiplier,
} from "../lib/damage.ts";
import {
  calculateFinalPanel as calculateResolvedPanel,
} from "../lib/calculator.ts";
import {
  getArtifactModifiers,
} from "../lib/data/artifacts/index.ts";
import type { CharacterPreset } from "../lib/data/characters/types.ts";
import type { DamageSettings } from "../lib/damage.ts";
import { hutao } from "../lib/data/characters/hutao.ts";
import { nahida } from "../lib/data/characters/nahida.ts";
import { dragonsBane } from "../lib/data/weapons/dragons-bane.ts";
import { weapons } from "../lib/data/weapons/index.ts";

function calculateRepresentativeDamage(
  character: CharacterPreset,
  build: BuildInput,
  resolvedPanel: FinalPanel,
  settings: DamageSettings,
) {
  return calculateResolvedDamage(
    character,
    build,
    resolvedPanel,
    settings,
    getArtifactModifiers(
      build.artifactSetId,
      build.artifactSetPieces,
      build.artifactSetSelections,
    ),
    weapons.find(({ id }) => id === build.weapon.id)?.passive
      .damageEffects ?? [],
  );
}

function calculateFinalPanel(build: BuildInput) {
  return calculateResolvedPanel(build, {
    artifactModifiers: getArtifactModifiers(
      build.artifactSetId,
      build.artifactSetPieces,
      build.artifactSetSelections,
    ),
  });
}

const artifact: BuildInput["artifact"] = {
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

const talentBonuses = {
  skill: 0,
  burst: 0,
  normal: 0,
  charged: 0,
  plunge: 0,
};

const panel: FinalPanel = {
  hp: 30000,
  atk: 1000,
  def: 800,
  critRate: 50,
  critDmg: 100,
  energyRecharge: 100,
  elementalMastery: 0,
  elementalDmg: 0,
  healingBonus: 0,
  talentBonuses,
};

test("uses level 105 defense and 10% resistance defaults", () => {
  assert.equal(calculateDefenseMultiplier(90, 105), 190 / 395);
  assert.equal(calculateResistanceMultiplier(10), 0.9);
  assert.equal(calculateResistanceMultiplier(-20), 1.1);
});

test("uses the character level table for additive reactions", () => {
  assert.equal(getReactionLevelMultiplier(80), 1077.443668);
  assert.equal(getReactionLevelMultiplier(90), 1446.853458);
  assert.equal(getReactionLevelMultiplier(0), 17.165605);
  assert.equal(getReactionLevelMultiplier(999), 1446.853458);
  assert.ok(
    Math.abs(calculateSpreadBonus(0, 80) - 1346.804585) <
      Number.EPSILON * 10_000,
  );
  assert.ok(
    Math.abs(calculateSpreadBonus(0, 90) - 1808.5668225) <
      Number.EPSILON * 10_000,
  );
});

test("calculates Hu Tao skill-enhanced charged attack reaction variants", () => {
  const build: BuildInput = {
    element: "pyro",
    character: hutao,
    weapon: {
      name: "测试长柄武器",
      level: 90,
      refinement: 1,
      baseAtk: 608,
      secondaryStat: "none",
      secondaryValue: 0,
    },
    artifact,
    talentBonuses,
  };
  const result = calculateRepresentativeDamage(hutao, build, panel, {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "below50",
    },
  });
  const charged = result.skills.find(
    (skill) => skill.id === "hutao-charged",
  );

  assert.ok(charged);
  assert.equal(charged.variants.length, 3);
  const [plain, vaporize, melt] = charged.variants;
  assert.ok(Math.abs(vaporize.nonCrit / plain.nonCrit - 1.5) < 0.001);
  assert.ok(Math.abs(melt.nonCrit / plain.nonCrit - 2) < 0.001);
  assert.equal(plain.crit, plain.nonCrit * 2);
});

test("uses separate normal, skill, and burst talent levels", () => {
  const build: BuildInput = {
    element: "pyro",
    character: hutao,
    weapon: {
      name: "测试长柄武器",
      level: 90,
      refinement: 1,
      baseAtk: 608,
      secondaryStat: "none",
      secondaryValue: 0,
    },
    artifact,
    talentBonuses,
  };
  const baseSettings = {
    ...defaultDamageSettings,
    skillTalentLevel: 10,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "above50",
    },
  };
  const lowNormal = calculateRepresentativeDamage(
    hutao,
    build,
    panel,
    {
      ...baseSettings,
      normalTalentLevel: 1,
      burstTalentLevel: 10,
    },
  );
  const highNormal = calculateRepresentativeDamage(
    hutao,
    build,
    panel,
    {
      ...baseSettings,
      normalTalentLevel: 10,
      burstTalentLevel: 10,
    },
  );
  const lowBurst = calculateRepresentativeDamage(
    hutao,
    build,
    panel,
    {
      ...baseSettings,
      normalTalentLevel: 10,
      burstTalentLevel: 1,
    },
  );

  assert.ok(
    highNormal.skills[0].variants[0].nonCrit >
      lowNormal.skills[0].variants[0].nonCrit,
  );
  assert.equal(
    highNormal.skills[1].variants[0].nonCrit,
    lowNormal.skills[1].variants[0].nonCrit,
  );
  assert.ok(
    highNormal.skills[1].variants[0].nonCrit >
      lowBurst.skills[1].variants[0].nonCrit,
  );
  assert.equal(
    highNormal.skills[0].variants[0].nonCrit,
    lowBurst.skills[0].variants[0].nonCrit,
  );
});

test("applies Shimenawa only to normal, charged, and plunge categories", () => {
  const shimenawaBuild: BuildInput = {
    element: "pyro",
    character: hutao,
    weapon: {
      name: "测试长柄武器",
      level: 90,
      refinement: 1,
      baseAtk: 608,
      secondaryStat: "none",
      secondaryValue: 0,
    },
    artifactSetId: "shimenawa",
    artifactSetPieces: 4,
    artifactSetSelections: { shimenawaState: "active" },
    artifact,
    talentBonuses,
  };
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "above50",
    },
  };
  const active = calculateRepresentativeDamage(
    hutao,
    shimenawaBuild,
    panel,
    settings,
  );
  const inactive = calculateRepresentativeDamage(
    hutao,
    {
      ...shimenawaBuild,
      artifactSetSelections: { shimenawaState: "inactive" },
    },
    panel,
    settings,
  );

  assert.ok(
    Math.abs(
      active.skills[0].variants[0].nonCrit /
        inactive.skills[0].variants[0].nonCrit -
        1.5,
    ) < 0.002,
  );
  assert.equal(
    active.skills[1].variants[0].nonCrit,
    inactive.skills[1].variants[0].nonCrit,
  );
});

test("applies every Dragon's Bane refinement against affected enemies", () => {
  const expectedRatios = [1.2, 1.24, 1.28, 1.32, 1.36];
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "above50",
    },
  };

  expectedRatios.forEach((expectedRatio, index) => {
    const baseBuild: BuildInput = {
      element: "pyro",
      character: hutao,
      weapon: { ...dragonsBane, refinement: index + 1 },
      weaponPassiveSelections: {
        dragonsBaneEnemyState: "none",
      },
      artifact,
      talentBonuses,
    };
    const inactive = calculateRepresentativeDamage(
      hutao,
      baseBuild,
      panel,
      settings,
    ).skills[0].variants[0];
    const active = calculateRepresentativeDamage(
      hutao,
      {
        ...baseBuild,
        weaponPassiveSelections: {
          dragonsBaneEnemyState: "affected",
        },
      },
      panel,
      settings,
    ).skills[0].variants[0];

    assert.ok(
      Math.abs(active.nonCrit / inactive.nonCrit - expectedRatio) <
        0.002,
    );
  });
});

test("applies Crimson Witch stacks to Pyro damage, not reaction bonus", () => {
  const baseBuild: BuildInput = {
    element: "pyro",
    character: hutao,
    weapon: {
      name: "测试长柄武器",
      level: 90,
      refinement: 1,
      baseAtk: 608,
      secondaryStat: "none",
      secondaryValue: 0,
    },
    artifact,
    talentBonuses,
  };
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "above50",
    },
  };
  const withoutSet = calculateRepresentativeDamage(
    hutao,
    baseBuild,
    panel,
    settings,
  ).skills[0];
  const twoPieceBuild: BuildInput = {
    ...baseBuild,
    artifactSetId: "crimson-witch",
    artifactSetPieces: 2,
  };
  const twoPiecePanel = calculateFinalPanel(twoPieceBuild);
  const withTwoPiece = calculateRepresentativeDamage(
    hutao,
    twoPieceBuild,
    { ...panel, elementalDmg: twoPiecePanel.elementalDmg },
    settings,
  ).skills[0];
  const basePlain = withoutSet.variants.find(
    ({ reaction }) => reaction === "none",
  );
  const twoPiecePlain = withTwoPiece.variants.find(
    ({ reaction }) => reaction === "none",
  );
  const twoPieceVaporize = withTwoPiece.variants.find(
    ({ reaction }) => reaction === "vaporize",
  );
  assert.ok(basePlain);
  assert.ok(twoPiecePlain);
  assert.ok(twoPieceVaporize);
  assert.ok(
    Math.abs(twoPiecePlain.nonCrit / basePlain.nonCrit - 1.15) < 0.001,
  );
  assert.ok(
    Math.abs(twoPieceVaporize.nonCrit / twoPiecePlain.nonCrit - 1.5) <
      0.002,
  );

  for (const [stacks, expectedPlainRatio] of [
    1.15, 1.225, 1.3, 1.375,
  ].entries()) {
    const fourPieceBuild: BuildInput = {
      ...baseBuild,
      artifactSetId: "crimson-witch",
      artifactSetPieces: 4,
      artifactSetSelections: {
        crimsonWitchStacks: String(stacks),
      },
    };
    const fourPiecePanel = calculateFinalPanel(fourPieceBuild);
    const withFourPiece = calculateRepresentativeDamage(
      hutao,
      fourPieceBuild,
      { ...panel, elementalDmg: fourPiecePanel.elementalDmg },
      settings,
    ).skills[0];
    const fourPiecePlain = withFourPiece.variants.find(
      ({ reaction }) => reaction === "none",
    );
    const fourPieceVaporize = withFourPiece.variants.find(
      ({ reaction }) => reaction === "vaporize",
    );

    assert.ok(fourPiecePlain);
    assert.ok(fourPieceVaporize);
    assert.ok(
      Math.abs(
        fourPiecePlain.nonCrit / basePlain.nonCrit -
          expectedPlainRatio,
      ) < 0.001,
    );
    assert.ok(
      Math.abs(
        fourPieceVaporize.nonCrit / fourPiecePlain.nonCrit -
          1.725,
      ) < 0.002,
    );
  }
});

test("applies Deepwood resistance reduction to Nahida damage", () => {
  const build: BuildInput = {
    element: "dendro",
    character: nahida,
    weapon: {
      name: "测试法器",
      level: 90,
      refinement: 1,
      baseAtk: 542,
      secondaryStat: "none",
      secondaryValue: 0,
    },
    artifactSetId: "deepwood",
    artifactSetPieces: 4,
    artifact,
    talentBonuses,
  };
  const result = calculateRepresentativeDamage(
    nahida,
    build,
    {
      ...panel,
      atk: 1500,
      elementalMastery: 800,
      elementalDmg: 15,
    },
    defaultDamageSettings,
  );

  assert.equal(result.effectiveResistance, -20);
  assert.equal(result.resistanceMultiplier, 1.1);
  const triKarma = result.skills[0];
  assert.equal(triKarma.variants[0].label, "不反应");
  assert.equal(triKarma.variants[1].label, "蔓激化");
  assert.ok(
    triKarma.variants[1].nonCrit > triKarma.variants[0].nonCrit,
  );
});
