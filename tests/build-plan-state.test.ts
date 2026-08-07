import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlansReducer,
  createInitialBuildPlansState,
} from "../app/hooks/use-build-plans.ts";

test("uses C0 for five-stars and C6 for four-stars by default", () => {
  let state = createInitialBuildPlansState();

  assert.equal(state.draft.characterId, "ayaka");
  assert.equal(state.draft.constellation, 0);
  assert.equal(state.draft.weaponId, "mistsplitter");
  assert.equal(state.draft.build.weapon.refinement, 1);

  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "xingqiu",
  });
  assert.equal(state.draft.constellation, 6);

  state = buildPlansReducer(state, { type: "reset-plan" });
  assert.equal(state.draft.constellation, 6);
  assert.equal(state.draft.weaponId, "favonius-sword");
  assert.equal(state.draft.build.weapon.refinement, 5);

  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "zhongli",
  });
  assert.equal(state.draft.constellation, 0);
  assert.equal(state.draft.weaponId, "favonius-lance");
  assert.equal(state.draft.build.weapon.refinement, 5);
});

test("keeps an edit when switching characters and back immediately", () => {
  let state = createInitialBuildPlansState();
  state = { ...state, hydrated: true };
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: { ...draft.build.artifact, flatAtk: 2345 },
      },
    }),
  });
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "hutao",
  });
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });

  assert.equal(state.draft.build.artifact.flatAtk, 2345);
  assert.equal(state.draft.characterId, "ayaka");
});

test("keeps each plan's latest edit when switching immediately", () => {
  let state = {
    ...createInitialBuildPlansState(),
    hydrated: true,
  };
  const originalId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: { ...draft.build.artifact, flatAtk: 111 },
      },
    }),
  });
  state = buildPlansReducer(state, {
    type: "create-plan",
    name: "第二方案",
  });
  const secondId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: { ...draft.build.artifact, flatAtk: 222 },
      },
    }),
  });
  state = buildPlansReducer(state, {
    type: "switch-plan",
    planId: originalId,
  });
  assert.equal(state.draft.build.artifact.flatAtk, 111);
  state = buildPlansReducer(state, {
    type: "switch-plan",
    planId: secondId,
  });
  assert.equal(state.draft.build.artifact.flatAtk, 222);
});

test("creates, renames, and deletes character-scoped plans", () => {
  let state = createInitialBuildPlansState();
  state = buildPlansReducer(state, {
    type: "create-plan",
    name: "冻结方案",
  });
  const createdId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "rename-plan",
    name: "融化方案",
  });

  assert.equal(
    state.store.plans.find((plan) => plan.id === createdId)?.name,
    "融化方案",
  );
  state = buildPlansReducer(state, { type: "delete-plan" });
  assert.notEqual(state.activePlanId, createdId);
  assert.equal(
    state.store.plans.some((plan) => plan.id === createdId),
    false,
  );
});

test("duplicates the active character plan with all current settings", () => {
  let state = {
    ...createInitialBuildPlansState(),
    hydrated: true,
  };
  const sourceId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      constellation: 4,
      build: {
        ...draft.build,
        artifact: { ...draft.build.artifact, flatAtk: 4321 },
      },
    }),
  });
  const sourcePlan = state.store.plans.find(
    (plan) => plan.id === sourceId,
  );
  assert.ok(sourcePlan);

  state = buildPlansReducer(state, { type: "duplicate-plan" });
  const copyId = state.activePlanId;
  const copy = state.store.plans.find((plan) => plan.id === copyId);

  assert.notEqual(copyId, sourceId);
  assert.equal(copy?.name, "神里绫华方案 1 副本");
  assert.deepEqual(copy?.snapshot, sourcePlan.snapshot);
  assert.notEqual(copy?.snapshot, sourcePlan.snapshot);
  assert.notEqual(copy?.snapshot.artifact, sourcePlan.snapshot.artifact);
  assert.equal(state.draft.constellation, 4);
  assert.equal(state.draft.build.artifact.flatAtk, 4321);
  assert.equal(state.status, "已复制为「神里绫华方案 1 副本」");

  state = buildPlansReducer(state, { type: "duplicate-plan" });
  assert.equal(
    state.store.plans.find((plan) => plan.id === state.activePlanId)
      ?.name,
    "神里绫华方案 1 副本 2",
  );
});

test("does not delete the final plan and resets only the active character", () => {
  let state = createInitialBuildPlansState();
  const originalId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: { ...draft.build.artifact, critRate: 999 },
      },
    }),
  });
  state = buildPlansReducer(state, { type: "delete-plan" });
  assert.equal(state.activePlanId, originalId);
  state = buildPlansReducer(state, { type: "reset-plan" });
  assert.equal(state.draft.build.artifact.critRate, 37.7);
  assert.equal(state.draft.characterId, "ayaka");
});

test("stores a visible persistence error without changing the draft", () => {
  const state = createInitialBuildPlansState();
  const next = buildPlansReducer(state, {
    type: "storage-error",
    message: "storage denied",
  });

  assert.equal(next.storageError, "storage denied");
  assert.equal(next.draft, state.draft);
});

test("persists constellation, teammate plan, and buff switches per plan", () => {
  let state = {
    ...createInitialBuildPlansState(),
    hydrated: true,
  };
  const ayakaPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "set-constellation",
    constellation: 4,
  });
  state = buildPlansReducer(state, {
    type: "set-team-character",
    slot: 0,
    characterId: "nahida",
  });
  const firstNahidaPlanId = state.draft.team.slots[0].planId;
  assert.ok(firstNahidaPlanId);

  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "nahida",
  });
  state = buildPlansReducer(state, {
    type: "create-plan",
    name: "纳西妲队友方案 2",
  });
  const secondNahidaPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });
  state = buildPlansReducer(state, {
    type: "set-team-plan",
    slot: 0,
    planId: secondNahidaPlanId,
  });
  state = buildPlansReducer(state, {
    type: "set-team-buff",
    buffId:
      "slot:0:character:nahida-compassion-illuminated",
    enabled: false,
  });

  assert.equal(state.activePlanId, ayakaPlanId);
  assert.equal(state.draft.constellation, 4);
  assert.equal(
    state.draft.team.slots[0].planId,
    secondNahidaPlanId,
  );
  assert.equal(
    state.draft.team.buffToggles[
      "slot:0:character:nahida-compassion-illuminated"
    ],
    false,
  );

  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "nahida",
  });
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });
  assert.equal(state.draft.constellation, 4);
  assert.equal(
    state.draft.team.slots[0].planId,
    secondNahidaPlanId,
  );
});

test("repairs teammate references when a selected source plan is deleted", () => {
  let state = createInitialBuildPlansState();
  state = buildPlansReducer(state, {
    type: "set-team-character",
    slot: 0,
    characterId: "nahida",
  });
  const fallbackPlanId = state.draft.team.slots[0].planId;
  assert.ok(fallbackPlanId);
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "nahida",
  });
  state = buildPlansReducer(state, {
    type: "create-plan",
    name: "待删除队友方案",
  });
  const deletedPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });
  state = buildPlansReducer(state, {
    type: "set-team-plan",
    slot: 0,
    planId: deletedPlanId,
  });
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "nahida",
  });
  state = buildPlansReducer(state, { type: "delete-plan" });
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });

  assert.equal(state.draft.team.slots[0].planId, fallbackPlanId);
});

test("uses distinct custom plans for a custom target and teammates", () => {
  let state = createInitialBuildPlansState();
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "custom",
  });
  const targetPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "set-team-character",
    slot: 0,
    characterId: "custom",
  });
  state = buildPlansReducer(state, {
    type: "set-team-character",
    slot: 1,
    characterId: "custom",
  });
  const firstTeammatePlanId = state.draft.team.slots[0].planId;
  const secondTeammatePlanId = state.draft.team.slots[1].planId;

  assert.ok(firstTeammatePlanId);
  assert.ok(secondTeammatePlanId);
  assert.notEqual(firstTeammatePlanId, targetPlanId);
  assert.notEqual(secondTeammatePlanId, targetPlanId);
  assert.notEqual(firstTeammatePlanId, secondTeammatePlanId);
});

test("opens a compared plan across character boundaries atomically", () => {
  let state = {
    ...createInitialBuildPlansState(),
    hydrated: true,
  };
  const ayakaPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "hutao",
  });
  const hutaoPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "ayaka",
  });

  assert.equal(state.activePlanId, ayakaPlanId);
  state = buildPlansReducer(state, {
    type: "open-plan",
    planId: hutaoPlanId,
  });

  assert.equal(state.activePlanId, hutaoPlanId);
  assert.equal(state.draft.characterId, "hutao");
  assert.equal(state.store.activeCharacterId, "hutao");
  assert.equal(state.store.activePlanIds.hutao, hutaoPlanId);
  assert.equal(state.status, "已打开「胡桃方案 1」");
});
