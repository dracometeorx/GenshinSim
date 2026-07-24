import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBuild as calculateResolvedBuild,
  type CalculationRequest,
} from "../lib/calculation.ts";
import {
  createResultPayload,
  createShareText,
} from "../lib/result-export.ts";
import type { BuildInput } from "../lib/calculator.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import { ayaka } from "../lib/data/characters/ayaka.ts";
import { hutao } from "../lib/data/characters/hutao.ts";
import { raiden } from "../lib/data/characters/raiden.ts";
import { engulfing } from "../lib/data/weapons/engulfing.ts";
import { homa } from "../lib/data/weapons/homa.ts";
import { mistsplitter } from "../lib/data/weapons/mistsplitter.ts";
import { theCatch } from "../lib/data/weapons/the-catch.ts";
import { getArtifactSet } from "../lib/data/artifacts/index.ts";

function calculateBuild(
  request: Omit<CalculationRequest, "weapon" | "artifactSet">,
) {
  return calculateResolvedBuild({
    ...request,
    weapon: mistsplitter,
    artifactSet: getArtifactSet(request.build.artifactSetId),
  });
}

const build: BuildInput = {
  element: "cryo",
  character: ayaka,
  weapon: mistsplitter,
  weaponPassiveSelections: { mistsplitterStacks: "0" },
  artifactSetId: "blizzard-strayer",
  artifactSetPieces: 4,
  artifactSetSelections: { blizzardEnemyState: "frozen" },
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

test("derives panel and damage from one request", () => {
  const result = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });

  assert.equal(result.panel.critRate, 45);
  assert.ok(result.skills.length > 0);
  assert.equal(result.defenseMultiplier, 190 / 395);
});

test("does not calculate Melt for Ayaka's representative skill", () => {
  const result = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const skill = result.skills.find(
    (item) => item.id === "ayaka-skill",
  );

  assert.deepEqual(
    skill?.variants.map(({ reaction }) => reaction),
    ["none"],
  );
  assert.equal(result.warnings.length, 0);
});

test("separates static panel from selected combat conditions", () => {
  const result = calculateResolvedBuild({
    build: {
      ...build,
      weaponPassiveSelections: { mistsplitterStacks: "3" },
    },
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet(build.artifactSetId),
    settings: defaultDamageSettings,
  });

  assert.equal(result.panel, result.combatPanel);
  assert.equal(result.staticPanel.critRate, 5);
  assert.equal(result.combatPanel.critRate, 45);
  assert.equal(result.staticPanel.elementalDmg, 27);
  assert.equal(result.combatPanel.elementalDmg, 73);
});

test("applies Hu Tao panel passives from the character preset", () => {
  const hutaoBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: hutao,
    weapon: homa,
    weaponPassiveSelections: { homaHpState: "below50" },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const result = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        hutaoHpState: "below50",
      },
    },
  });

  assert.equal(result.staticPanel.elementalDmg, 0);
  assert.equal(result.combatPanel.elementalDmg, 33);
  assert.ok(result.combatPanel.atk > result.staticPanel.atk);
  assert.ok(
    result.skills[0].description.includes(
      result.combatPanel.atk.toLocaleString("zh-CN"),
    ),
  );
});

test("runs additive weapon effects before character conversions", () => {
  const raidenBuild: BuildInput = {
    ...build,
    element: "electro",
    character: raiden,
    weapon: engulfing,
    weaponPassiveSelections: { engulfingBurst: "active" },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const result = calculateResolvedBuild({
    build: raidenBuild,
    character: raiden,
    weapon: engulfing,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
  });

  assert.equal(result.staticPanel.energyRecharge, 187.1);
  assert.equal(result.combatPanel.energyRecharge, 217.1);
  assert.equal(result.staticPanel.elementalDmg, 34.8);
  assert.equal(result.combatPanel.elementalDmg, 46.8);
  assert.ok(result.combatPanel.atk > result.staticPanel.atk);
});

test("uses the resolved catalog character when request fields disagree", () => {
  const mismatchedBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: {
      ...build.character,
      baseAtk: 1,
    },
  };
  const result = calculateBuild({
    build: mismatchedBuild,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const expected = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });

  assert.deepEqual(result.panel, expected.panel);
  assert.equal(
    result.warnings[0]?.code,
    "CHARACTER_BUILD_NORMALIZED",
  );
});

test("excludes incompatible Blizzard crit rate from Hu Tao Melt expectation", () => {
  const hutaoBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: hutao,
    weapon: homa,
    weaponPassiveSelections: { homaHpState: "below50" },
  };
  const result = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("blizzard-strayer"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        hutaoHpState: "below50",
      },
    },
  });
  const skill = result.skills.find(
    (item) => item.id === "hutao-charged",
  );
  const plain = skill?.variants.find((variant) => variant.reaction === "none");
  const melt = skill?.variants.find((variant) => variant.reaction === "melt");

  assert.ok(plain);
  assert.ok(melt);
  assert.equal(
    result.warnings[0]?.code,
    "INCOMPATIBLE_BLIZZARD_MELT_CONDITION",
  );
  const critFactor = result.panel.critDmg / 100;
  assert.ok(
    Math.abs(
      plain.expected / plain.nonCrit -
        (1 + (result.panel.critRate / 100) * critFactor),
    ) < 0.002,
  );
  assert.ok(
    Math.abs(melt.expected / melt.nonCrit - (1 + 0.05 * critFactor)) <
      0.002,
  );
});

test("applies every The Catch refinement to burst damage and CRIT rate", () => {
  const catchBuild: BuildInput = {
    ...build,
    element: "electro",
    character: raiden,
    weapon: theCatch,
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      raidenEyeState: "inactive",
      raidenResolveStacks: "0",
    },
  };
  const calculateAtRefinement = (refinement: number) =>
    calculateResolvedBuild({
      build: {
        ...catchBuild,
        weapon: { ...theCatch, refinement },
      },
      character: raiden,
      weapon: theCatch,
      artifactSet: getArtifactSet("none"),
      settings,
    }).skills[0].variants[0];
  const variants = [1, 2, 3, 4, 5].map(calculateAtRefinement);
  const burstDamageBonuses = [16, 20, 24, 28, 32];
  const burstCritRates = [6, 7.5, 9, 10.5, 12];

  variants.forEach((variant, index) => {
    const expectedCritFactor =
      1 + ((5 + burstCritRates[index]) / 100) * 0.5;
    const expectedDamageRatio =
      (1.312 + burstDamageBonuses[index] / 100) /
      (1.312 + burstDamageBonuses[0] / 100);

    assert.ok(
      Math.abs(
        variant.expected / variant.nonCrit -
          expectedCritFactor,
      ) < 0.002,
    );
    assert.ok(
      Math.abs(
        variant.nonCrit / variants[0].nonCrit -
          expectedDamageRatio,
      ) < 0.002,
    );
  });
});

test("exports panel and damage from the same recalculation", () => {
  const changedBuild = {
    ...build,
    artifact: {
      ...build.artifact,
      flatAtk: build.artifact.flatAtk + 321,
    },
  };
  const result = calculateBuild({
    build: changedBuild,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const payload = createResultPayload({
    artifactSetName: "无",
    build: changedBuild,
    elementLabel: "冰元素",
    result,
    settings: defaultDamageSettings,
  });
  const shareText = createShareText(changedBuild, result);

  assert.equal(payload.攻击力, result.panel.atk);
  assert.deepEqual(
    payload.代表技能伤害,
    Object.fromEntries(
      result.skills.map((skill) => [
        skill.name,
        Object.fromEntries(
          skill.variants.map((variant) => [
            variant.label,
            {
              未暴击: variant.nonCrit,
              暴击: variant.crit,
              期望: variant.expected,
            },
          ]),
        ),
      ]),
    ),
  );
  assert.ok(
    shareText.includes(result.panel.atk.toLocaleString("zh-CN")),
  );
});
