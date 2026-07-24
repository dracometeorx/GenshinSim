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
  legacyBuildPlansStorageKeys,
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
import {
  cloneTeamConfiguration,
  createEmptyTeamConfiguration,
} from "../../lib/team-types.ts";
import { clampConstellation } from "../../lib/constellations.ts";

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
  | {
      type: "set-team-character";
      slot: number;
      characterId: string | null;
    }
  | { type: "set-constellation"; constellation: number }
  | { type: "set-team-plan"; slot: number; planId: string }
  | {
      type: "set-team-buff";
      buffId: string;
      enabled: boolean;
    }
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
    case "set-team-character": {
      if (
        action.slot < 0 ||
        action.slot > 2 ||
        (action.characterId === state.draft.characterId &&
          action.characterId !== "custom")
      ) {
        return state;
      }
      const character = action.characterId
        ? characters.find(
            (item) => item.id === action.characterId,
          )
        : undefined;
      if (action.characterId && !character) return state;

      let plans = state.store.plans;
      const unavailablePlanIds = new Set(
        state.draft.team.slots.flatMap((slot, index) =>
          index !== action.slot && slot.planId
            ? [slot.planId]
            : [],
        ),
      );
      if (character?.id === state.draft.characterId) {
        unavailablePlanIds.add(state.activePlanId);
      }
      const teammatePlans = character
        ? plans.filter(
            (plan) =>
              plan.snapshot.characterId === character.id &&
              !unavailablePlanIds.has(plan.id),
          )
        : [];
      let teammatePlan =
        teammatePlans.find(
          (plan) =>
            plan.id === state.store.activePlanIds[character?.id ?? ""],
        ) ?? teammatePlans[0];
      if (character && !teammatePlan) {
        const teammateDraft = {
          ...createDraftForCharacter(
            state.draft,
            character.id,
          ),
          team: createEmptyTeamConfiguration(),
        };
        teammatePlan = createBuildPlan(
          createBuildPlanSnapshot(teammateDraft),
          `${character.name}方案 1`,
        );
        plans = [...plans, teammatePlan];
      }

      const team = cloneTeamConfiguration(state.draft.team);
      if (character?.id !== "custom") {
        team.slots = team.slots.map((slot, index) =>
          index !== action.slot &&
          slot.characterId === character?.id
            ? { characterId: null, planId: null }
            : slot,
        ) as typeof team.slots;
      }
      team.slots[action.slot] = character
        ? {
            characterId: character.id,
            planId: teammatePlan?.id ?? null,
          }
        : { characterId: null, planId: null };
      team.buffToggles = Object.fromEntries(
        Object.entries(team.buffToggles).filter(
          ([key]) => !key.startsWith(`slot:${action.slot}:`),
        ),
      );

      const committed = commitDraft(
        { ...state, store: { ...state.store, plans } },
        { ...state.draft, team },
        character
          ? `已配置队友「${character.name}」`
          : `已清空队友 ${action.slot + 1}`,
      );
      if (!character || !teammatePlan) return committed;
      return {
        ...committed,
        store: {
          ...committed.store,
          activePlanIds: {
            ...committed.store.activePlanIds,
            [character.id]:
              committed.store.activePlanIds[character.id] ??
              teammatePlan.id,
          },
        },
      };
    }
    case "set-constellation":
      return commitDraft(state, {
        ...state.draft,
        constellation: clampConstellation(action.constellation),
      });
    case "set-team-plan": {
      if (action.slot < 0 || action.slot > 2) return state;
      const team = cloneTeamConfiguration(state.draft.team);
      const currentSlot = team.slots[action.slot];
      const plan = state.store.plans.find(
        (item) =>
          item.id === action.planId &&
          item.snapshot.characterId === currentSlot?.characterId &&
          item.id !== state.activePlanId &&
          !team.slots.some(
            (slot, index) =>
              index !== action.slot && slot.planId === item.id,
          ),
      );
      if (!currentSlot || !plan || currentSlot.planId === plan.id) {
        return state;
      }
      team.slots[action.slot] = {
        ...currentSlot,
        planId: plan.id,
      };
      team.buffToggles = Object.fromEntries(
        Object.entries(team.buffToggles).filter(
          ([key]) => !key.startsWith(`slot:${action.slot}:`),
        ),
      );
      return commitDraft(state, { ...state.draft, team });
    }
    case "set-team-buff": {
      const buffId = action.buffId.trim().slice(0, 160);
      if (!buffId) return state;
      const team = cloneTeamConfiguration(state.draft.team);
      team.buffToggles[buffId] = action.enabled;
      return commitDraft(state, { ...state.draft, team });
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
      const repairedPlans = plans.map((plan) => ({
        ...plan,
        snapshot: {
          ...plan.snapshot,
          team: {
            ...plan.snapshot.team,
            slots: plan.snapshot.team.slots.map((slot) =>
              slot.characterId === state.draft.characterId &&
              slot.planId === state.activePlanId
                ? {
                    characterId: slot.characterId,
                    planId: nextPlan.id,
                  }
                : slot,
            ) as typeof plan.snapshot.team.slots,
          },
        },
      }));
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
          plans: repairedPlans,
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
      constellation: 0,
      team: createEmptyTeamConfiguration(),
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
      const legacyPlanKey = legacyBuildPlansStorageKeys.find(
        (key) => window.localStorage.getItem(key),
      );
      const legacyPlanRaw = legacyPlanKey
        ? window.localStorage.getItem(legacyPlanKey)
        : null;
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

      legacyBuildPlansStorageKeys.forEach((key) =>
        window.localStorage.removeItem(key),
      );
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
    constellation: state.draft.constellation,
    team: state.draft.team,
    plans: state.store.plans,
    setBuild,
    setDamageSettings,
    setWeaponId,
    setConstellation: (constellation: number) =>
      dispatch({
        type: "set-constellation",
        constellation,
      }),
    setTeamSlotCharacter: (
      slot: number,
      characterId: string | null,
    ) =>
      dispatch({
        type: "set-team-character",
        slot,
        characterId,
      }),
    setTeamSlotPlan: (slot: number, planId: string) =>
      dispatch({
        type: "set-team-plan",
        slot,
        planId,
      }),
    setTeamBuffEnabled: (buffId: string, enabled: boolean) =>
      dispatch({
        type: "set-team-buff",
        buffId,
        enabled,
      }),
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
