import {
  buildPlansSchemaVersion,
  createBuildPlan,
  createBuildPlanSnapshot,
  type BuildPlan,
  type BuildPlanSnapshot,
  type BuildPlanStore,
} from "./build-plans.ts";
import type { BuildInput, ElementKey } from "./calculator.ts";
import {
  defaultDamageSettings,
  type DamageSettings,
} from "./damage.ts";
import { cloneDefaultBuild, defaultBuild } from "./default-build.ts";
import { artifactSets, getArtifactSet } from "./data/artifacts/index.ts";
import {
  characters,
  type CharacterPreset,
} from "./data/characters/index.ts";
import {
  getCompatibleWeapons,
  isWeaponCompatible,
  weapons,
  type WeaponPreset,
} from "./data/weapons/index.ts";

const elements: ElementKey[] = [
  "cryo",
  "hydro",
  "pyro",
  "electro",
  "anemo",
  "geo",
  "dendro",
];

export type BuildPlanDraft = {
  build: BuildInput;
  characterId: string;
  weaponId: string;
  damageSettings: DamageSettings;
};

export type PersistedDamageSettings = Partial<DamageSettings> & {
  talentLevel?: number;
};

export type LegacyBuildInput = Omit<BuildInput, "artifact"> & {
  artifact: BuildInput["artifact"] & {
    hpPct?: number;
    atkPct?: number;
    defPct?: number;
  };
};

function finiteInRange(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric)
    ? Math.min(max, Math.max(min, numeric))
    : fallback;
}

export function clampRefinement(value: unknown) {
  return Math.round(finiteInRange(value, 1, 1, 5));
}

export function normalizeDamageSettings(
  persisted?: PersistedDamageSettings,
  character?: CharacterPreset,
): DamageSettings {
  const legacyTalentLevel = Math.round(
    finiteInRange(
      persisted?.talentLevel,
      defaultDamageSettings.normalTalentLevel,
      1,
      10,
    ),
  );
  const controls = character?.damageProfile?.controls ?? [];
  const sourceSelections = persisted?.selections ?? {};
  const selections = {
    ...defaultDamageSettings.selections,
    ...Object.fromEntries(
      controls.map((control) => {
        const requested = sourceSelections[control.key];
        const value =
          typeof requested === "string" &&
          control.options.some((option) => option.value === requested)
          ? requested
          : control.defaultValue;
        return [control.key, value];
      }),
    ),
  };

  return {
    enemyLevel: Math.round(
      finiteInRange(
        persisted?.enemyLevel,
        defaultDamageSettings.enemyLevel,
        1,
        200,
      ),
    ),
    enemyResistance: finiteInRange(
      persisted?.enemyResistance,
      defaultDamageSettings.enemyResistance,
      -100,
      1000,
    ),
    normalTalentLevel: Math.round(
      finiteInRange(
        persisted?.normalTalentLevel,
        legacyTalentLevel,
        1,
        10,
      ),
    ),
    skillTalentLevel: Math.round(
      finiteInRange(
        persisted?.skillTalentLevel,
        legacyTalentLevel,
        1,
        10,
      ),
    ),
    burstTalentLevel: Math.round(
      finiteInRange(
        persisted?.burstTalentLevel,
        legacyTalentLevel,
        1,
        10,
      ),
    ),
    selections,
  };
}

export function getPreferredWeapon(character: CharacterPreset) {
  const preferred = weapons.find(
    (weapon) =>
      weapon.id === character.defaultWeaponId &&
      isWeaponCompatible(character.weaponType, weapon),
  );
  return preferred ?? getCompatibleWeapons(character.weaponType)[0] ?? weapons[0];
}

export function getWeaponPassiveSelections(
  weapon: WeaponPreset,
  character: CharacterPreset,
  settings: DamageSettings,
  currentSelections?: Record<string, string>,
) {
  const control = weapon.passive.control;
  if (!control) return {};
  const requested =
    weapon.id === "homa" && character.id === "hutao"
      ? settings.selections.hutaoHpState
      : currentSelections?.[control.key];
  const value =
    typeof requested === "string" &&
    control.options.some((option) => option.value === requested)
      ? requested
      : control.defaultValue;
  return { [control.key]: value };
}

function normalizeArtifact(
  artifact: BuildPlanSnapshot["artifact"],
): BuildPlanSnapshot["artifact"] {
  return {
    flatHp: finiteInRange(artifact.flatHp, defaultBuild.artifact.flatHp, 0, 1e7),
    flatAtk: finiteInRange(
      artifact.flatAtk,
      defaultBuild.artifact.flatAtk,
      0,
      1e7,
    ),
    flatDef: finiteInRange(
      artifact.flatDef,
      defaultBuild.artifact.flatDef,
      0,
      1e7,
    ),
    critRate: finiteInRange(
      artifact.critRate,
      defaultBuild.artifact.critRate,
      0,
      10000,
    ),
    critDmg: finiteInRange(
      artifact.critDmg,
      defaultBuild.artifact.critDmg,
      0,
      10000,
    ),
    energyRecharge: finiteInRange(
      artifact.energyRecharge,
      defaultBuild.artifact.energyRecharge,
      0,
      10000,
    ),
    elementalMastery: finiteInRange(
      artifact.elementalMastery,
      defaultBuild.artifact.elementalMastery,
      0,
      1e7,
    ),
    elementalDmg: finiteInRange(
      artifact.elementalDmg,
      defaultBuild.artifact.elementalDmg,
      0,
      10000,
    ),
    healingBonus: finiteInRange(
      artifact.healingBonus,
      defaultBuild.artifact.healingBonus,
      0,
      10000,
    ),
  };
}

function normalizeTalentBonuses(
  bonuses: BuildPlanSnapshot["talentBonuses"],
): BuildPlanSnapshot["talentBonuses"] {
  return {
    skill: finiteInRange(bonuses.skill, 0, 0, 10000),
    burst: finiteInRange(bonuses.burst, 0, 0, 10000),
    normal: finiteInRange(bonuses.normal, 0, 0, 10000),
    charged: finiteInRange(bonuses.charged, 0, 0, 10000),
    plunge: finiteInRange(bonuses.plunge, 0, 0, 10000),
  };
}

export function normalizeBuildPlanSnapshot(
  snapshot: BuildPlanSnapshot,
): BuildPlanSnapshot {
  const character =
    characters.find((item) => item.id === snapshot.characterId) ??
    characters[0];
  const requestedWeapon = weapons.find(
    (item) => item.id === snapshot.weaponId,
  );
  const weapon =
    requestedWeapon &&
    isWeaponCompatible(character.weaponType, requestedWeapon)
      ? requestedWeapon
      : getPreferredWeapon(character);
  const damageSettings = normalizeDamageSettings(
    snapshot.damageSettings,
    character,
  );
  const artifactSet = artifactSets.find(
    (item) => item.id === snapshot.artifactSetId,
  );
  const artifactSetId = artifactSet?.id ?? "none";
  const requestedPieces = Number(snapshot.artifactSetPieces);
  const artifactSetPieces =
    artifactSetId === "none" || ![2, 4].includes(requestedPieces)
      ? 0
      : (requestedPieces as 2 | 4);
  const control =
    artifactSetPieces === 4
      ? getArtifactSet(artifactSetId).fourPiece.control
      : undefined;
  const requestedControlValue = control
    ? snapshot.artifactSetSelections[control.key]
    : undefined;
  const artifactSetSelections = control
    ? {
        [control.key]:
          typeof requestedControlValue === "string" &&
          control.options.some(
            (option) => option.value === requestedControlValue,
          )
          ? requestedControlValue
          : control.defaultValue,
      }
    : {};
  const element =
    character.id === "custom" && elements.includes(snapshot.element)
      ? snapshot.element
      : character.element;

  return {
    element,
    characterId: character.id,
    weaponId: weapon.id,
    weaponRefinement: clampRefinement(snapshot.weaponRefinement),
    weaponPassiveSelections: getWeaponPassiveSelections(
      weapon,
      character,
      damageSettings,
      snapshot.weaponPassiveSelections,
    ),
    artifactSetId,
    artifactSetPieces,
    artifactSetSelections,
    artifact: normalizeArtifact(snapshot.artifact),
    talentBonuses: normalizeTalentBonuses(snapshot.talentBonuses),
    damageSettings,
  };
}

export function restorePlanSnapshot(
  input: BuildPlanSnapshot,
): BuildPlanDraft {
  const snapshot = normalizeBuildPlanSnapshot(input);
  const character =
    characters.find((item) => item.id === snapshot.characterId) ??
    characters[0];
  const weaponPreset =
    weapons.find((item) => item.id === snapshot.weaponId) ??
    getPreferredWeapon(character);
  const weapon = {
    ...weaponPreset,
    refinement: snapshot.weaponRefinement,
  };
  return {
    build: {
      element: snapshot.element,
      character,
      weapon,
      weaponPassiveSelections: {
        ...snapshot.weaponPassiveSelections,
      },
      artifactSetId: snapshot.artifactSetId,
      artifactSetPieces: snapshot.artifactSetPieces,
      artifactSetSelections: {
        ...snapshot.artifactSetSelections,
      },
      artifact: { ...snapshot.artifact },
      talentBonuses: { ...snapshot.talentBonuses },
    },
    characterId: character.id,
    weaponId: weapon.id,
    damageSettings: {
      ...snapshot.damageSettings,
      selections: { ...snapshot.damageSettings.selections },
    },
  };
}

export function normalizeBuildPlanStore(
  store: BuildPlanStore,
): BuildPlanStore {
  const seenIds = new Set<string>();
  const plans = store.plans.reduce<BuildPlan[]>((result, plan) => {
    if (seenIds.has(plan.id)) return result;
    seenIds.add(plan.id);
    result.push({
      ...plan,
      name: plan.name.trim().slice(0, 80) || "未命名方案",
      snapshot: normalizeBuildPlanSnapshot(plan.snapshot),
    });
    return result;
  }, []);

  if (!plans.length) {
    return createDefaultPlanStore();
  }

  const groups = plans.reduce<Record<string, BuildPlan[]>>(
    (result, plan) => {
      (result[plan.snapshot.characterId] ??= []).push(plan);
      return result;
    },
    {},
  );
  const activeCharacterId = groups[store.activeCharacterId]
    ? store.activeCharacterId
    : plans[0].snapshot.characterId;
  const activePlanIds = Object.fromEntries(
    Object.entries(groups).map(([characterId, characterPlans]) => {
      const candidates = characterPlans;
      const requested = candidates.find(
        (plan) => plan.id === store.activePlanIds[characterId],
      );
      return [characterId, requested?.id ?? candidates[0].id];
    }),
  );

  return {
    schemaVersion: buildPlansSchemaVersion,
    activeCharacterId,
    activePlanIds,
    plans,
  };
}

export function createDefaultDraft(): BuildPlanDraft {
  return {
    build: cloneDefaultBuild(),
    characterId: "ayaka",
    weaponId: "mistsplitter",
    damageSettings: normalizeDamageSettings(undefined, characters[0]),
  };
}

export function createDraftForCharacter(
  current: BuildPlanDraft,
  characterId: string,
): BuildPlanDraft {
  const character =
    characters.find((item) => item.id === characterId) ?? characters[0];
  const currentWeapon = weapons.find(
    (item) => item.id === current.weaponId,
  );
  const weaponPreset =
    currentWeapon &&
    isWeaponCompatible(character.weaponType, currentWeapon)
      ? currentWeapon
      : getPreferredWeapon(character);
  const weaponChanged = current.weaponId !== weaponPreset.id;
  const damageSettings = normalizeDamageSettings(
    {
      ...current.damageSettings,
      selections: { ...current.damageSettings.selections },
    },
    character,
  );
  const weapon = weaponChanged
    ? { ...weaponPreset }
    : {
        ...weaponPreset,
        refinement: clampRefinement(current.build.weapon.refinement),
      };

  return {
    characterId: character.id,
    weaponId: weapon.id,
    damageSettings,
    build: {
      ...current.build,
      character,
      weapon,
      element:
        character.id === "custom"
          ? current.build.element
          : character.element,
      weaponPassiveSelections: getWeaponPassiveSelections(
        weaponPreset,
        character,
        damageSettings,
        weaponChanged
          ? undefined
          : current.build.weaponPassiveSelections,
      ),
      artifact: { ...current.build.artifact },
      artifactSetSelections: {
        ...current.build.artifactSetSelections,
      },
      talentBonuses: { ...current.build.talentBonuses },
    },
  };
}

export function resetDraftForCharacter(
  current: BuildPlanDraft,
): BuildPlanDraft {
  const character =
    characters.find((item) => item.id === current.characterId) ??
    characters[0];
  const weapon = getPreferredWeapon(character);
  const damageSettings = normalizeDamageSettings(undefined, character);
  return {
    characterId: character.id,
    weaponId: weapon.id,
    damageSettings,
    build: {
      ...cloneDefaultBuild(),
      character: { ...character },
      weapon: { ...weapon },
      element:
        character.id === "custom"
          ? current.build.element
          : character.element,
      weaponPassiveSelections: getWeaponPassiveSelections(
        weapon,
        character,
        damageSettings,
      ),
    },
  };
}

export function createDefaultPlanStore() {
  const draft = createDefaultDraft();
  const plan = createBuildPlan(
    createBuildPlanSnapshot(draft),
    `${draft.build.character.name}方案 1`,
  );
  return {
    schemaVersion: buildPlansSchemaVersion,
    activeCharacterId: draft.characterId,
    activePlanIds: { [draft.characterId]: plan.id },
    plans: [plan],
  } satisfies BuildPlanStore;
}

export function activeDraftFromStore(store: BuildPlanStore) {
  const normalizedStore = normalizeBuildPlanStore(store);
  const requestedId =
    normalizedStore.activePlanIds[normalizedStore.activeCharacterId];
  const plan =
    normalizedStore.plans.find((item) => item.id === requestedId) ??
    normalizedStore.plans[0];
  return {
    store: normalizedStore,
    activePlanId: plan.id,
    draft: restorePlanSnapshot(plan.snapshot),
  };
}

export function migrateLegacyBuild(
  legacy: LegacyBuildInput,
): BuildInput {
  const hpPct = Math.max(0, Number(legacy.artifact.hpPct) || 0);
  const atkPct = Math.max(0, Number(legacy.artifact.atkPct) || 0);
  const defPct = Math.max(0, Number(legacy.artifact.defPct) || 0);
  const baseAtk =
    Math.max(0, legacy.character.baseAtk) +
    Math.max(0, legacy.weapon.baseAtk);

  return {
    ...legacy,
    artifact: {
      flatHp: Math.round(
        Math.max(0, legacy.artifact.flatHp) +
          Math.max(0, legacy.character.baseHp) * (hpPct / 100),
      ),
      flatAtk: Math.round(
        Math.max(0, legacy.artifact.flatAtk) + baseAtk * (atkPct / 100),
      ),
      flatDef: Math.round(
        Math.max(0, legacy.artifact.flatDef) +
          Math.max(0, legacy.character.baseDef) * (defPct / 100),
      ),
      critRate: legacy.artifact.critRate,
      critDmg: legacy.artifact.critDmg,
      energyRecharge: legacy.artifact.energyRecharge,
      elementalMastery: legacy.artifact.elementalMastery,
      elementalDmg: legacy.artifact.elementalDmg,
      healingBonus: legacy.artifact.healingBonus,
    },
  };
}

export function createStoreFromLegacyDraft(draft: BuildPlanDraft) {
  const snapshot = normalizeBuildPlanSnapshot(
    createBuildPlanSnapshot(draft),
  );
  const plan = createBuildPlan(
    snapshot,
    `${restorePlanSnapshot(snapshot).build.character.name}方案 1`,
  );
  return {
    schemaVersion: buildPlansSchemaVersion,
    activeCharacterId: snapshot.characterId,
    activePlanIds: { [snapshot.characterId]: plan.id },
    plans: [plan],
  } satisfies BuildPlanStore;
}
