import assert from "node:assert/strict";
import test from "node:test";

import { calculateFinalPanel } from "../lib/calculator.ts";
import type { BuildInput } from "../lib/calculator.ts";

const build: BuildInput = {
  element: "hydro",
  character: {
    name: "测试角色",
    level: 90,
    baseHp: 12000,
    baseAtk: 300,
    baseDef: 700,
    ascensionStat: "hpPct",
    ascensionValue: 20,
  },
  weapon: {
    name: "测试武器",
    level: 90,
    refinement: 1,
    baseAtk: 600,
    secondaryStat: "atkPct",
    secondaryValue: 30,
  },
  artifact: {
    flatHp: 9000,
    flatAtk: 1000,
    flatDef: 500,
    critRate: 40,
    critDmg: 100,
    energyRecharge: 20,
    elementalMastery: 80,
    elementalDmg: 46.6,
    healingBonus: 15,
  },
  talentBonuses: {
    skill: 0,
    burst: 0,
    normal: 0,
    charged: 0,
    plunge: 0,
  },
};

test("uses direct artifact HP, ATK, and DEF bonuses", () => {
  const panel = calculateFinalPanel(build);

  assert.equal(panel.hp, 23400);
  assert.equal(panel.atk, 2170);
  assert.equal(panel.def, 1200);
});

test("supports Hydro builds and preserves standard panel stats", () => {
  const panel = calculateFinalPanel(build);

  assert.deepEqual(
    {
      critRate: panel.critRate,
      critDmg: panel.critDmg,
      energyRecharge: panel.energyRecharge,
      elementalMastery: panel.elementalMastery,
      elementalDmg: panel.elementalDmg,
      healingBonus: panel.healingBonus,
    },
    {
      critRate: 45,
      critDmg: 150,
      energyRecharge: 120,
      elementalMastery: 80,
      elementalDmg: 46.6,
      healingBonus: 15,
    },
  );
});
