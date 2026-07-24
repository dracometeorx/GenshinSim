"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  buildPlansSchemaVersion,
  buildPlansStorageKey,
  createBuildPlan,
  createBuildPlanSnapshot,
  legacyBuildPlansStorageKey,
  parseBuildPlanStore,
  type BuildPlanStore,
} from "../../lib/build-plans.ts";
import {
  activeDraftFromStore,
  clampRefinement,
  createDefaultPlanStore,
  createDraftForCharacter,
  createStoreFromLegacyDraft,
  getPreferredWeapon,
  getWeaponPassiveSelections,
  migrateLegacyBuild,
  normalizeBuildPlanStore,
  normalizeDamageSettings,
  resetDraftForCharacter,
  restorePlanSnapshot,
  type BuildPlanDraft,
  type LegacyBuildInput,
  type PersistedDamageSettings,
} from "../../lib/build-plan-runtime.ts";
import type { BuildInput } from "../../lib/calculator.ts";
import type { DamageSettings } from "../../lib/damage.ts";
import { characters } from "../../lib/data/characters/index.ts";
import {
  isWeaponCompatible,
  weapons,
} from "../../lib/data/weapons/index.ts";

const legacyStorageKeys = [
  "genshin-panel-build-v6",
  "genshin-panel-build-v5",
  "genshin-panel-build-v4",
  "genshin-panel-build-v3",
  "genshin-panel-build-v2",
  "genshin-panel-build-v1",
];

export type BuildPlansState = {
  store: BuildPlanStore;
  draft: BuildPlanDraft;
  activePlanId: string;
  hydrated: boolean;
  status: string;
  storageError: string | null;
};

export type BuildPlansAction =
  | {
      type: "hydrate";
      store: BuildPlanStore;
      status: string;
    }
  | {
      type: "update-draft";
      update: (draft: BuildPlanDraft) => BuildPlanDraft;
    }
  | { type: "switch-plan"; planId: string }
  | { type: "switch-character"; characterId: string }
  | { type: "create-plan"; name: string }
  | { type: "rename-plan"; name: string }
  | { type: "delete-plan" }
  | { type: "reset-plan" }
  | { type: "set-status"; status: string }
  | { type: "storage-error"; message: string | null };

function activePlanName(state: BuildPlansState) {
  return (
    state.store.plans.find((plan) => plan.id === state.activePlanId)
      ?.name ?? "当前方案"
  );
}

function commitDraft(
  state: BuildPlansState,
  draft: BuildPlanDraft,
  status = state.status,
): BuildPlansState {
  const snapshot = createBuildPlanSnapshot(draft);
  const now = new Date().toISOString();
  const plans = state.store.plans.map((plan) =>
    plan.id === state.activePlanId
      ? { ...plan, updatedAt: now, snapshot }
      : plan,
  );
  return {
    ...state,
    draft,
    status,
    store: {
      ...state.store,
      activeCharacterId: draft.characterId,
      activePlanIds: {
        ...state.store.activePlanIds,
        [draft.characterId]: state.activePlanId,
      },
      plans,
    },
  };
}

export function buildPlansReducer(
  state: BuildPlansState,
  action: BuildPlansAction,
): BuildPlansState {
  switch (action.type) {
    case "hydrate": {
      const restored = activeDraftFromStore(action.store);
      return {
        store: restored.store,
        activePlanId: restored.activePlanId,
        draft: restored.draft,
        hydrated: true,
        status: action.status,
        storageError: null,
      };
    }
    case "update-draft":
      return commitDraft(state, action.update(state.draft));
    case "switch-plan": {
      const plan = state.store.plans.find(
        (item) =>
          item.id === action.planId &&
          item.snapshot.characterId === state.draft.characterId,
      );
      if (!plan || plan.id === state.activePlanId) return state;
      return {
        ...state,
        activePlanId: plan.id,
        draft: restorePlanSnapshot(plan.snapshot),
        status: `已切换到「${plan.name}」`,
        store: {
          ...state.store,
          activeCharacterId: plan.snapshot.characterId,
          activePlanIds: {
            ...state.store.activePlanIds,
            [plan.snapshot.characterId]: plan.id,
          },
        },
      };
    }
    case "switch-character": {
      if (action.characterId === state.draft.characterId) return state;
      const requestedId = state.store.activePlanIds[action.characterId];
      const existingPlan =
        state.store.plans.find(
          (plan) =>
            plan.id === requestedId &&
            plan.snapshot.characterId === action.characterId,
        ) ??
        state.store.plans.find(
          (plan) => plan.snapshot.characterId === action.characterId,
        );
      if (existingPlan) {
        return {
          ...state,
          activePlanId: existingPlan.id,
          draft: restorePlanSnapshot(existingPlan.snapshot),
          status: `已切换到「${existingPlan.name}」`,
          store: {
            ...state.store,
            activeCharacterId: action.characterId,
            activePlanIds: {
              ...state.store.activePlanIds,
              [action.characterId]: existingPlan.id,
            },
          },
        };
      }

      const draft = createDraftForCharacter(
        state.draft,
        action.characterId,
      );
      const plan = createBuildPlan(
        createBuildPlanSnapshot(draft),
        `${draft.build.character.name}方案 1`,
      );
      return {
        ...state,
        activePlanId: plan.id,
        draft,
        status: `已创建「${plan.name}」`,
        store: {
          ...state.store,
          activeCharacterId: draft.characterId,
          activePlanIds: {
            ...state.store.activePlanIds,
            [draft.characterId]: plan.id,
          },
          plans: [...state.store.plans, plan],
        },
      };
    }
    case "create-plan": {
      const plan = createBuildPlan(
        createBuildPlanSnapshot(state.draft),
        action.name,
      );
      return {
        ...state,
        activePlanId: plan.id,
        status: `已新建「${plan.name}」`,
        store: {
          ...state.store,
          activePlanIds: {
            ...state.store.activePlanIds,
            [state.draft.characterId]: plan.id,
          },
          plans: [...state.store.plans, plan],
        },
      };
    }
    case "rename-plan": {
      const name = action.name.trim().slice(0, 80);
      if (!name || name === activePlanName(state)) return state;
      const plans = state.store.plans.map((plan) =>
        plan.id === state.activePlanId
          ? { ...plan, name, updatedAt: new Date().toISOString() }
          : plan,
      );
      return {
        ...state,
        status: `已重命名为「${name}」`,
        store: { ...state.store, plans },
      };
    }
    case "delete-plan": {
      const characterPlans = state.store.plans.filter(
        (plan) =>
          plan.snapshot.characterId === state.draft.characterId,
      );
      if (characterPlans.length <= 1) return state;
      const deletedName = activePlanName(state);
      const plans = state.store.plans.filter(
        (plan) => plan.id !== state.activePlanId,
      );
      const nextPlan = plans.find(
        (plan) =>
          plan.snapshot.characterId === state.draft.characterId,
      );
      if (!nextPlan) return state;
      return {
        ...state,
        activePlanId: nextPlan.id,
        draft: restorePlanSnapshot(nextPlan.snapshot),
        status: `已删除「${deletedName}」`,
        store: {
          ...state.store,
          activePlanIds: {
            ...state.store.activePlanIds,
            [state.draft.characterId]: nextPlan.id,
          },
          plans,
        },
      };
    }
    case "reset-plan":
      return commitDraft(
        state,
        resetDraftForCharacter(state.draft),
        "当前方案已重置",
      );
    case "set-status":
      return { ...state, status: action.status };
    case "storage-error":
      return { ...state, storageError: action.message };
  }
}

export function createInitialBuildPlansState(): BuildPlansState {
  const store = createDefaultPlanStore();
  const restored = activeDraftFromStore(store);
  return {
    store: restored.store,
    draft: restored.draft,
    activePlanId: restored.activePlanId,
    hydrated: false,
    status: "方案载入中",
    storageError: null,
  };
}

function legacyStoreFromRaw(
  raw: string,
  sourceKey: string,
): BuildPlanStore | null {
  try {
    const parsed = JSON.parse(raw) as {
      build: BuildInput | LegacyBuildInput;
      characterId: string;
      weaponId: string;
      damageSettings?: PersistedDamageSettings;
    };
    const restoredBuild =
      sourceKey === "genshin-panel-build-v1"
        ? migrateLegacyBuild(parsed.build as LegacyBuildInput)
        : (parsed.build as BuildInput);
    const character =
      characters.find((item) => item.id === parsed.characterId) ??
      characters.find(
        (item) => item.name === restoredBuild.character.name,
      ) ??
      characters[0];
    const requestedWeapon =
      weapons.find((item) => item.id === parsed.weaponId) ??
      weapons.find((item) => item.name === restoredBuild.weapon.name);
    const weaponPreset =
      requestedWeapon &&
      isWeaponCompatible(character.weaponType, requestedWeapon)
        ? requestedWeapon
        : getPreferredWeapon(character);
    const damageSettings = normalizeDamageSettings(
      parsed.damageSettings,
      character,
    );
    const draft: BuildPlanDraft = {
      characterId: character.id,
      weaponId: weaponPreset.id,
      damageSettings,
      build: {
        ...restoredBuild,
        character,
        weapon: {
          ...weaponPreset,
          refinement: clampRefinement(
            requestedWeapon?.id === weaponPreset.id
              ? restoredBuild.weapon.refinement
              : weaponPreset.refinement,
          ),
        },
        element:
          character.id === "custom"
            ? restoredBuild.element
            : character.element,
        weaponPassiveSelections: getWeaponPassiveSelections(
          weaponPreset,
          character,
          damageSettings,
          restoredBuild.weaponPassiveSelections,
        ),
      },
    };
    return createStoreFromLegacyDraft(draft);
  } catch {
    return null;
  }
}

export function useBuildPlans() {
  const [state, dispatch] = useReducer(
    buildPlansReducer,
    undefined,
    createInitialBuildPlansState,
  );

  useEffect(() => {
    let store: BuildPlanStore | null = null;
    let status = "已创建默认方案";
    try {
      const currentRaw = window.localStorage.getItem(
        buildPlansStorageKey,
      );
      const legacyPlanRaw = window.localStorage.getItem(
        legacyBuildPlansStorageKey,
      );
      const parsed =
        parseBuildPlanStore(currentRaw) ??
        parseBuildPlanStore(legacyPlanRaw);
      if (parsed) {
        store = normalizeBuildPlanStore(parsed);
        status = currentRaw
          ? "已恢复角色方案"
          : "已按角色迁移方案";
      } else {
        const sourceKey = legacyStorageKeys.find((key) =>
          window.localStorage.getItem(key),
        );
        const raw = sourceKey
          ? window.localStorage.getItem(sourceKey)
          : null;
        if (raw && sourceKey) {
          store = legacyStoreFromRaw(raw, sourceKey);
          status = store ? "已迁移为角色方案" : status;
        }
      }

      window.localStorage.removeItem(legacyBuildPlansStorageKey);
      legacyStorageKeys.forEach((key) =>
        window.localStorage.removeItem(key),
      );
    } catch {
      status = "本地方案不可用，已使用临时方案";
    }
    dispatch({
      type: "hydrate",
      store: store ?? createDefaultPlanStore(),
      status,
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(
        buildPlansStorageKey,
        JSON.stringify({
          ...state.store,
          schemaVersion: buildPlansSchemaVersion,
        }),
      );
      if (state.storageError) {
        dispatch({ type: "storage-error", message: null });
      }
    } catch {
      if (!state.storageError) {
        dispatch({
          type: "storage-error",
          message: "浏览器未能保存方案，本次修改可能只在当前页面有效。",
        });
      }
    }
  }, [state.hydrated, state.storageError, state.store]);

  const setBuild: Dispatch<SetStateAction<BuildInput>> = useCallback(
    (value) => {
      dispatch({
        type: "update-draft",
        update: (draft) => ({
          ...draft,
          build:
            typeof value === "function"
              ? value(draft.build)
              : value,
        }),
      });
    },
    [],
  );
  const setDamageSettings: Dispatch<SetStateAction<DamageSettings>> =
    useCallback((value) => {
      dispatch({
        type: "update-draft",
        update: (draft) => ({
          ...draft,
          damageSettings:
            typeof value === "function"
              ? value(draft.damageSettings)
              : value,
        }),
      });
    }, []);
  const setWeaponId = useCallback((weaponId: string) => {
    dispatch({
      type: "update-draft",
      update: (draft) => ({ ...draft, weaponId }),
    });
  }, []);

  return {
    ...state,
    build: state.draft.build,
    characterId: state.draft.characterId,
    weaponId: state.draft.weaponId,
    damageSettings: state.draft.damageSettings,
    plans: state.store.plans,
    setBuild,
    setDamageSettings,
    setWeaponId,
    choosePlan: (planId: string) =>
      dispatch({ type: "switch-plan", planId }),
    chooseCharacter: (characterId: string) =>
      dispatch({ type: "switch-character", characterId }),
    createPlan: (name: string) =>
      dispatch({ type: "create-plan", name }),
    renamePlan: (name: string) =>
      dispatch({ type: "rename-plan", name }),
    deletePlan: () => dispatch({ type: "delete-plan" }),
    resetPlan: () => dispatch({ type: "reset-plan" }),
    setStatus: (status: string) =>
      dispatch({ type: "set-status", status }),
  };
}
