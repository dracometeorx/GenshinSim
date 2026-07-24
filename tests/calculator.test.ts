import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFinalPanel as calculateResolvedPanel,
} from "../lib/calculator.ts";
import type { BuildInput } from "../lib/calculator.ts";
import {
  getArtifactModifiers,
} from "../lib/data/artifacts/index.ts";
import { weapons } from "../lib/data/weapons/index.ts";

function calculateFinalPanel(input: BuildInput) {
  const weapon = weapons.find((item) => item.id === input.weapon.id);
  return calculateResolvedPanel(input, {
    artifactModifiers: getArtifactModifiers(
      input.artifactSetId,
      input.artifactSetPieces,
      input.artifactSetSelections,
    ),
    panelEffects: weapon?.passive.panelEffects,
  });
}

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

test("applies Mistsplitter stacks to elemental damage", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "mistsplitter",
    },
    weaponPassiveSelections: { mistsplitterStacks: "3" },
  });

  assert.equal(panel.elementalDmg, 86.6);
});

test("scales Mistsplitter bonuses with refinement", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "mistsplitter",
      refinement: 5,
    },
    weaponPassiveSelections: { mistsplitterStacks: "3" },
  });

  assert.equal(panel.elementalDmg, 126.6);
});

test("uses every Mistsplitter refinement tier", () => {
  const expected = [86.6, 96.6, 106.6, 116.6, 126.6];
  expected.forEach((elementalDmg, index) => {
    const panel = calculateFinalPanel({
      ...build,
      weapon: {
        ...build.weapon,
        id: "mistsplitter",
        refinement: index + 1,
      },
      weaponPassiveSelections: { mistsplitterStacks: "3" },
    });
    assert.equal(panel.elementalDmg, elementalDmg);
  });
});

test("applies Staff of Homa HP and conditional ATK bonuses", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "homa",
      secondaryStat: "critDmg",
      secondaryValue: 66.2,
    },
    weaponPassiveSelections: { homaHpState: "below50" },
  });

  assert.equal(panel.hp, 25800);
  assert.equal(panel.atk, 2364);
});

test("scales Staff of Homa bonuses with refinement", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "homa",
      refinement: 5,
      secondaryStat: "critDmg",
      secondaryValue: 66.2,
    },
    weaponPassiveSelections: { homaHpState: "below50" },
  });

  assert.equal(panel.hp, 28200);
  assert.equal(panel.atk, 2859);
});

test("uses every Staff of Homa refinement tier", () => {
  const expectedHp = [25800, 26400, 27000, 27600, 28200];
  const expectedAtk = [2364, 2481, 2602, 2728, 2859];
  expectedHp.forEach((hp, index) => {
    const panel = calculateFinalPanel({
      ...build,
      weapon: {
        ...build.weapon,
        id: "homa",
        refinement: index + 1,
        secondaryStat: "critDmg",
        secondaryValue: 66.2,
      },
      weaponPassiveSelections: { homaHpState: "below50" },
    });
    assert.equal(panel.hp, hp);
    assert.equal(panel.atk, expectedAtk[index]);
  });
});

test("applies Engulfing Lightning burst ER before its ATK conversion", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "engulfing",
      secondaryStat: "energyRecharge",
      secondaryValue: 55.1,
    },
    weaponPassiveSelections: { engulfingBurst: "active" },
  });

  assert.equal(panel.energyRecharge, 205.1);
  assert.equal(panel.atk, 2165);
});

test("scales Engulfing Lightning bonuses with refinement", () => {
  const panel = calculateFinalPanel({
    ...build,
    weapon: {
      ...build.weapon,
      id: "engulfing",
      refinement: 5,
      secondaryStat: "energyRecharge",
      secondaryValue: 55.1,
    },
    weaponPassiveSelections: { engulfingBurst: "active" },
  });

  assert.equal(panel.energyRecharge, 225.1);
  assert.equal(panel.atk, 2531);
});

test("uses every Engulfing Lightning refinement tier", () => {
  const expectedEr = [205.1, 210.1, 215.1, 220.1, 225.1];
  const expectedAtk = [2165, 2247, 2335, 2430, 2531];
  expectedEr.forEach((energyRecharge, index) => {
    const panel = calculateFinalPanel({
      ...build,
      weapon: {
        ...build.weapon,
        id: "engulfing",
        refinement: index + 1,
        secondaryStat: "energyRecharge",
        secondaryValue: 55.1,
      },
      weaponPassiveSelections: { engulfingBurst: "active" },
    });
    assert.equal(panel.energyRecharge, energyRecharge);
    assert.equal(panel.atk, expectedAtk[index]);
  });
});

test("applies Blizzard Strayer damage and conditional CRIT Rate", () => {
  const panel = calculateFinalPanel({
    ...build,
    element: "cryo",
    artifactSetId: "blizzard-strayer",
    artifactSetPieces: 4,
    artifactSetSelections: { blizzardEnemyState: "frozen" },
  });

  assert.equal(panel.elementalDmg, 61.6);
  assert.equal(panel.critRate, 85);
});

test("adds Crimson Witch stacks to the two-piece Pyro bonus", () => {
  const twoPiecePanel = calculateFinalPanel({
    ...build,
    element: "pyro",
    artifactSetId: "crimson-witch",
    artifactSetPieces: 2,
  });
  assert.equal(twoPiecePanel.elementalDmg, 61.6);
  for (const [stacks, expected] of [61.6, 69.1, 76.6, 84.1].entries()) {
    const fourPiecePanel = calculateFinalPanel({
      ...build,
      element: "pyro",
      artifactSetId: "crimson-witch",
      artifactSetPieces: 4,
      artifactSetSelections: {
        crimsonWitchStacks: String(stacks),
      },
    });
    assert.equal(fourPiecePanel.elementalDmg, expected);
  }
});

test("converts final Energy Recharge into Emblem burst damage", () => {
  const panel = calculateFinalPanel({
    ...build,
    artifactSetId: "emblem",
    artifactSetPieces: 4,
    weapon: {
      ...build.weapon,
      id: "engulfing",
      secondaryStat: "energyRecharge",
      secondaryValue: 55.1,
    },
    weaponPassiveSelections: { engulfingBurst: "active" },
  });

  assert.equal(panel.energyRecharge, 225.1);
  assert.equal(panel.atk, 2215);
  assert.equal(panel.talentBonuses.burst, 56.3);
});

test("keeps Deepwood enemy resistance outside the character panel", () => {
  const panel = calculateFinalPanel({
    ...build,
    element: "dendro",
    artifactSetId: "deepwood",
    artifactSetPieces: 4,
  });

  assert.equal(panel.elementalDmg, 61.6);
  assert.deepEqual(panel.talentBonuses, build.talentBonuses);
});
