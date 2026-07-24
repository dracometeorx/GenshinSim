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
import {
  normalizeBuildPlanSnapshot,
  restorePlanSnapshot,
} from "../lib/build-plan-runtime.ts";

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
  const team = {
    slots: [
      { characterId: "nahida", planId: "nahida-team-plan" },
      { characterId: null, planId: null },
      { characterId: null, planId: null },
    ],
    buffToggles: {
      "slot:0:character:nahida-compassion-illuminated": false,
    },
  } as const;
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
    constellation: 6,
    team: {
      slots: [...team.slots],
      buffToggles: { ...team.buffToggles },
    },
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
  assert.equal(snapshot.constellation, 6);
  assert.deepEqual(snapshot.team, team);
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
  clone.team.slots[0] = {
    characterId: "nahida",
    planId: "changed-plan",
  };
  clone.team.buffToggles.changed = false;

  assert.equal(snapshot.artifact.critRate, 70);
  assert.equal(snapshot.weaponPassiveSelections.homaHpState, "below50");
  assert.equal(
    snapshot.damageSettings.selections.hutaoSkillState,
    "active",
  );
  assert.equal(snapshot.team.slots[0].planId, null);
  assert.equal(snapshot.team.buffToggles.changed, undefined);
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
  assert.equal(parseBuildPlanStore("{damaged-json"), null);
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

test("migrates v2 snapshots with empty constellation and team defaults", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const plan = createBuildPlan(snapshot, "旧版胡桃方案", {
    id: "legacy-v2-plan",
  });
  const legacySnapshot = { ...plan.snapshot };
  Reflect.deleteProperty(legacySnapshot, "constellation");
  Reflect.deleteProperty(legacySnapshot, "team");
  const migrated = parseBuildPlanStore(
    JSON.stringify({
      schemaVersion: 2,
      activeCharacterId: "hutao",
      activePlanIds: { hutao: plan.id },
      plans: [{ ...plan, snapshot: legacySnapshot }],
    }),
  );

  assert.equal(migrated?.schemaVersion, buildPlansSchemaVersion);
  assert.equal(migrated?.plans[0].snapshot.constellation, 0);
  assert.deepEqual(migrated?.plans[0].snapshot.team, {
    slots: [
      { characterId: null, planId: null },
      { characterId: null, planId: null },
      { characterId: null, planId: null },
    ],
    buffToggles: {},
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

test("normalizes unknown catalog ids, conditions, and numeric ranges", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const normalized = normalizeBuildPlanSnapshot({
    ...snapshot,
    element: "invalid" as typeof snapshot.element,
    characterId: "missing-character",
    weaponId: "missing-weapon",
    weaponRefinement: 99,
    artifactSetId: "missing-set",
    artifactSetPieces: 4,
    artifact: {
      ...snapshot.artifact,
      critRate: -10,
    },
    damageSettings: {
      ...snapshot.damageSettings,
      enemyLevel: 999,
      enemyResistance: -999,
      selections: { ayakaDashBonus: "invalid" },
    },
    constellation: 99,
    team: {
      slots: [
        { characterId: "missing-character", planId: "missing" },
        { characterId: "ayaka", planId: "self" },
        { characterId: "hutao", planId: "hutao-plan" },
      ],
      buffToggles: { valid: false },
    },
  });
  const restored = restorePlanSnapshot(normalized);

  assert.equal(normalized.characterId, "ayaka");
  assert.equal(normalized.weaponId, "mistsplitter");
  assert.equal(normalized.element, "cryo");
  assert.equal(normalized.weaponRefinement, 5);
  assert.equal(normalized.artifactSetId, "none");
  assert.equal(normalized.artifactSetPieces, 0);
  assert.equal(normalized.artifact.critRate, 0);
  assert.equal(normalized.damageSettings.enemyLevel, 200);
  assert.equal(normalized.damageSettings.enemyResistance, -100);
  assert.equal(normalized.constellation, 6);
  assert.deepEqual(normalized.team.slots, [
    { characterId: null, planId: null },
    { characterId: null, planId: null },
    { characterId: "hutao", planId: "hutao-plan" },
  ]);
  assert.equal(normalized.team.buffToggles.valid, false);
  assert.equal(
    normalized.damageSettings.selections.ayakaDashBonus,
    "active",
  );
  assert.equal(restored.build.character.name, "神里绫华");
});

test("normalizes and restores new weapon and artifact conditions", () => {
  const snapshot = createBuildPlanSnapshot({
    build,
    characterId: "hutao",
    weaponId: "homa",
    damageSettings,
  });
  const normalized = normalizeBuildPlanSnapshot({
    ...snapshot,
    weaponId: "dragons-bane",
    weaponRefinement: 3,
    weaponPassiveSelections: {
      dragonsBaneEnemyState: "invalid",
    },
    artifactSetId: "shimenawa",
    artifactSetPieces: 4,
    artifactSetSelections: {
      shimenawaState: "invalid",
    },
  });
  const restored = restorePlanSnapshot(normalized);

  assert.equal(normalized.weaponId, "dragons-bane");
  assert.equal(normalized.weaponRefinement, 3);
  assert.deepEqual(normalized.weaponPassiveSelections, {
    dragonsBaneEnemyState: "affected",
  });
  assert.equal(normalized.artifactSetId, "shimenawa");
  assert.equal(normalized.artifactSetPieces, 4);
  assert.deepEqual(normalized.artifactSetSelections, {
    shimenawaState: "active",
  });
  assert.equal(restored.build.weapon.name, "匣里灭辰");
  assert.deepEqual(restored.build.weaponPassiveSelections, {
    dragonsBaneEnemyState: "affected",
  });
  assert.deepEqual(restored.build.artifactSetSelections, {
    shimenawaState: "active",
  });
});
