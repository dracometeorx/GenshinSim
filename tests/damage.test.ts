import assert from "node:assert/strict";
import test from "node:test";

import type { BuildInput, FinalPanel } from "../lib/calculator.ts";
import {
  calculateDefenseMultiplier,
  calculateRepresentativeDamage,
  calculateResistanceMultiplier,
  defaultDamageSettings,
} from "../lib/damage.ts";
import { hutao } from "../lib/data/characters/hutao.ts";
import { nahida } from "../lib/data/characters/nahida.ts";

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

test("applies Crimson Witch bonuses in final damage instead of the panel", () => {
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
  const withWitch = calculateRepresentativeDamage(
    hutao,
    {
      ...baseBuild,
      artifactSetId: "crimson-witch",
      artifactSetPieces: 4,
      artifactSetSelections: { crimsonWitchStacks: "3" },
    },
    panel,
    settings,
  ).skills[0];
  const basePlain = withoutSet.variants.find(
    ({ reaction }) => reaction === "none",
  );
  const witchPlain = withWitch.variants.find(
    ({ reaction }) => reaction === "none",
  );
  const witchVaporize = withWitch.variants.find(
    ({ reaction }) => reaction === "vaporize",
  );

  assert.ok(basePlain);
  assert.ok(witchPlain);
  assert.ok(witchVaporize);
  assert.ok(
    Math.abs(witchPlain.nonCrit / basePlain.nonCrit - 1.375) < 0.001,
  );
  assert.ok(
    Math.abs(witchVaporize.nonCrit / witchPlain.nonCrit - 1.725) < 0.001,
  );
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
