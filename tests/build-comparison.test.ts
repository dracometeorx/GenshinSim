import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlansReducer,
  createInitialBuildPlansState,
} from "../app/hooks/use-build-plans.ts";
import {
  createBuildComparisonEntries,
  createCharacterBuildComparisonEntries,
} from "../lib/build-comparison.ts";

test("recalculates saved plans and exposes build and team summaries", () => {
  let state = {
    ...createInitialBuildPlansState(),
    hydrated: true,
  };
  const baselinePlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: {
          ...draft.build.artifact,
          flatAtk: 100,
        },
      },
    }),
  });
  state = buildPlansReducer(state, {
    type: "create-plan",
    name: "高攻击方案",
  });
  const highAttackPlanId = state.activePlanId;
  state = buildPlansReducer(state, {
    type: "update-draft",
    update: (draft) => ({
      ...draft,
      build: {
        ...draft.build,
        artifact: {
          ...draft.build.artifact,
          flatAtk: 2100,
        },
      },
    }),
  });
  state = buildPlansReducer(state, {
    type: "set-team-character",
    slot: 0,
    characterId: "nahida",
  });

  const entries = createBuildComparisonEntries(
    state.store.plans,
  );
  const ayakaEntries = createCharacterBuildComparisonEntries(
    state.store.plans,
    "ayaka",
  );
  const baseline = entries.find(
    (entry) => entry.plan.id === baselinePlanId,
  );
  const highAttack = entries.find(
    (entry) => entry.plan.id === highAttackPlanId,
  );

  assert.ok(baseline?.primaryDamage);
  assert.ok(highAttack?.primaryDamage);
  assert.ok(
    highAttack.primaryDamage.expected >
      baseline.primaryDamage.expected,
  );
  assert.equal(highAttack.weaponName, "雾切之回光");
  assert.equal(highAttack.weaponRefinement, 1);
  assert.equal(highAttack.artifactName, "冰风");
  assert.equal(highAttack.artifactPieces, 4);
  assert.equal(highAttack.teammates.length, 1);
  assert.equal(highAttack.teammates[0].characterName, "纳西妲");
  assert.ok(highAttack.damages.length > 0);
  assert.equal(
    ayakaEntries.every((entry) => entry.characterId === "ayaka"),
    true,
  );
  assert.equal(
    ayakaEntries.length,
    entries.filter((entry) => entry.characterId === "ayaka").length,
  );
  assert.equal(
    highAttack.calculation.panel.atk >
      baseline.calculation.panel.atk,
    true,
  );
});

test("keeps custom-character plans comparable without representative damage", () => {
  let state = createInitialBuildPlansState();
  state = buildPlansReducer(state, {
    type: "switch-character",
    characterId: "custom",
  });
  const customPlanId = state.activePlanId;
  const entry = createBuildComparisonEntries(
    state.store.plans,
  ).find((item) => item.plan.id === customPlanId);

  assert.ok(entry);
  assert.equal(entry.primaryDamage, null);
  assert.deepEqual(entry.damages, []);
  assert.ok(entry.calculation.panel.atk > 0);
});
