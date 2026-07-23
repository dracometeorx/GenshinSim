import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlansSchemaVersion,
  cloneBuildPlanSnapshot,
  createBuildPlan,
  createBuildPlanSnapshot,
  parseBuildPlanStore,
} from "../lib/build-plans.ts";
import type { BuildInput } from "../lib/calculator.ts";
import type { DamageSettings } from "../lib/damage.ts";

const build: BuildInput = {
  element: "pyro",
  character: {
    name: "胡桃",
    level: 90,
    baseHp: 15552,
    baseAtk: 106,
    baseDef: 876,
    ascensionStat: "critDmg",
    ascensionValue: 38.4,
  },
  weapon: {
    id: "homa",
    name: "护摩之杖",
    weaponType: "polearm",
    level: 90,
    refinement: 5,
    baseAtk: 608,
    secondaryStat: "critDmg",
    secondaryValue: 66.2,
  },
  weaponPassiveSelections: { homaHpState: "below50" },
  artifactSetId: "crimson-witch",
  artifactSetPieces: 4,
  artifactSetSelections: { crimsonWitchStacks: "3" },
  artifact: {
    flatHp: 12000,
    flatAtk: 1000,
    flatDef: 100,
    critRate: 70,
    critDmg: 140,
    energyRecharge: 20,
    elementalMastery: 120,
    elementalDmg: 46.6,
    healingBonus: 0,
  },
  talentBonuses: {
    skill: 10,
    burst: 20,
    normal: 0,
    charged: 15,
    plunge: 0,
  },
};

const damageSettings: DamageSettings = {
  enemyLevel: 105,
  enemyResistance: 10,
  normalTalentLevel: 10,
  skillTalentLevel: 9,
  burstTalentLevel: 8,
  selections: {
    hutaoHpState: "below50",
    hutaoSkillState: "active",
  },
};

test("captures every user-controlled build-plan setting", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });

  assert.equal(snapshot.characterId, "hutao");
  assert.equal(snapshot.weaponId, "homa");
  assert.equal(snapshot.weaponRefinement, 5);
  assert.deepEqual(snapshot.weaponPassiveSelections, {
    homaHpState: "below50",
  });
  assert.equal(snapshot.artifactSetId, "crimson-witch");
  assert.equal(snapshot.artifactSetPieces, 4);
  assert.deepEqual(snapshot.artifactSetSelections, {
    crimsonWitchStacks: "3",
  });
  assert.deepEqual(snapshot.artifact, build.artifact);
  assert.deepEqual(snapshot.talentBonuses, build.talentBonuses);
  assert.deepEqual(snapshot.damageSettings, damageSettings);
});

test("clones nested plan state instead of sharing mutable references", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const clone = cloneBuildPlanSnapshot(snapshot);

  clone.artifact.critRate = 5;
  clone.weaponPassiveSelections.homaHpState = "above50";
  clone.damageSettings.selections.hutaoSkillState = "inactive";

  assert.equal(snapshot.artifact.critRate, 70);
  assert.equal(snapshot.weaponPassiveSelections.homaHpState, "below50");
  assert.equal(
    snapshot.damageSettings.selections.hutaoSkillState,
    "active",
  );
});

test("round-trips a versioned build-plan store", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const plan = createBuildPlan(snapshot, "胡桃护摩魔女", {
    id: "hutao-plan",
    now: "2026-07-23T12:00:00.000Z",
  });
  const store = {
    schemaVersion: buildPlansSchemaVersion,
    activeCharacterId: "hutao",
    activePlanIds: { hutao: plan.id },
    plans: [plan],
  };

  assert.deepEqual(parseBuildPlanStore(JSON.stringify(store)), store);
  assert.equal(parseBuildPlanStore('{"schemaVersion":1,"plans":[]}'), null);
});

test("migrates global v1 plans into character-scoped active plans", () => {
  const hutaoSnapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const ayakaSnapshot = {
    ...cloneBuildPlanSnapshot(hutaoSnapshot),
    characterId: "ayaka",
    weaponId: "mistsplitter",
  };
  const hutaoPlan = createBuildPlan(hutaoSnapshot, "胡桃方案", {
    id: "hutao-plan",
    now: "2026-07-23T12:00:00.000Z",
  });
  const ayakaPlan = createBuildPlan(ayakaSnapshot, "绫华方案", {
    id: "ayaka-plan",
    now: "2026-07-23T12:01:00.000Z",
  });

  const migrated = parseBuildPlanStore(
    JSON.stringify({
      schemaVersion: 1,
      activePlanId: ayakaPlan.id,
      plans: [hutaoPlan, ayakaPlan],
    }),
  );

  assert.equal(migrated?.schemaVersion, buildPlansSchemaVersion);
  assert.equal(migrated?.activeCharacterId, "ayaka");
  assert.deepEqual(migrated?.activePlanIds, {
    hutao: hutaoPlan.id,
    ayaka: ayakaPlan.id,
  });
});

test("repairs cross-character active plan ids instead of exposing them", () => {
  const hutaoSnapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const ayakaPlan = createBuildPlan(
    {
      ...cloneBuildPlanSnapshot(hutaoSnapshot),
      characterId: "ayaka",
      weaponId: "mistsplitter",
    },
    "同名方案",
    { id: "ayaka-plan" },
  );
  const hutaoPlan = createBuildPlan(hutaoSnapshot, "同名方案", {
    id: "hutao-plan",
  });

  const repaired = parseBuildPlanStore(
    JSON.stringify({
      schemaVersion: buildPlansSchemaVersion,
      activeCharacterId: "hutao",
      activePlanIds: {
        hutao: ayakaPlan.id,
        ayaka: hutaoPlan.id,
      },
      plans: [hutaoPlan, ayakaPlan],
    }),
  );

  assert.equal(repaired?.activePlanIds.hutao, hutaoPlan.id);
  assert.equal(repaired?.activePlanIds.ayaka, ayakaPlan.id);
});
