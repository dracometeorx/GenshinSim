import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlansReducer,
  createInitialBuildPlansState,
} from "../app/hooks/use-build-plans.ts";

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
