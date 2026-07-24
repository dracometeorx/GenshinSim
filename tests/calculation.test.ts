import assert from "node:assert/strict";
import test from "node:test";

import { calculateBuild } from "../lib/calculation.ts";
import {
  createResultPayload,
  createShareText,
} from "../lib/result-export.ts";
import type { BuildInput } from "../lib/calculator.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import { ayaka } from "../lib/data/characters/ayaka.ts";
import { mistsplitter } from "../lib/data/weapons/mistsplitter.ts";

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

test("excludes incompatible Blizzard crit rate from Melt expectation", () => {
  const result = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const skill = result.skills.find((item) => item.id === "ayaka-skill");
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
