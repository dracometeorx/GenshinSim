import type {
  ArtifactStats,
  BuildInput,
  ElementKey,
  TalentBonuses,
} from "./calculator.ts";
import type { DamageSettings } from "./damage.ts";

export const buildPlansStorageKey = "genshin-build-plans-v2";
export const legacyBuildPlansStorageKey = "genshin-build-plans-v1";
export const buildPlansSchemaVersion = 2;

export interface BuildPlanSnapshot {
  element: ElementKey;
  characterId: string;
  weaponId: string;
  weaponRefinement: number;
  weaponPassiveSelections: Record<string, string>;
  artifactSetId: string;
  artifactSetPieces: 0 | 2 | 4;
  artifactSetSelections: Record<string, string>;
  artifact: ArtifactStats;
  talentBonuses: TalentBonuses;
  damageSettings: DamageSettings;
}

export interface BuildPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  snapshot: BuildPlanSnapshot;
}

export interface BuildPlanStore {
  schemaVersion: typeof buildPlansSchemaVersion;
  activeCharacterId: string;
  activePlanIds: Record<string, string>;
  plans: BuildPlan[];
}

function clampRefinement(value: number) {
  return Math.min(5, Math.max(1, Math.round(Number(value) || 1)));
}

function cloneSelections(selections?: Record<string, string>) {
  return { ...(selections ?? {}) };
}

export function createBuildPlanSnapshot({
  build,
  characterId,
  weaponId,
  damageSettings,
}: {
  build: BuildInput;
  characterId: string;
  weaponId: string;
  damageSettings: DamageSettings;
}): BuildPlanSnapshot {
  return {
    element: build.element,
    characterId,
    weaponId,
    weaponRefinement: clampRefinement(build.weapon.refinement),
    weaponPassiveSelections: cloneSelections(
      build.weaponPassiveSelections,
    ),
    artifactSetId: build.artifactSetId ?? "none",
    artifactSetPieces: build.artifactSetPieces ?? 0,
    artifactSetSelections: cloneSelections(
      build.artifactSetSelections,
    ),
    artifact: { ...build.artifact },
    talentBonuses: { ...build.talentBonuses },
    damageSettings: {
      ...damageSettings,
      selections: cloneSelections(damageSettings.selections),
    },
  };
}

export function cloneBuildPlanSnapshot(
  snapshot: BuildPlanSnapshot,
): BuildPlanSnapshot {
  return {
    ...snapshot,
    weaponRefinement: clampRefinement(snapshot.weaponRefinement),
    weaponPassiveSelections: cloneSelections(
      snapshot.weaponPassiveSelections,
    ),
    artifactSetSelections: cloneSelections(
      snapshot.artifactSetSelections,
    ),
    artifact: { ...snapshot.artifact },
    talentBonuses: { ...snapshot.talentBonuses },
    damageSettings: {
      ...snapshot.damageSettings,
      selections: cloneSelections(snapshot.damageSettings.selections),
    },
  };
}

export function createBuildPlan(
  snapshot: BuildPlanSnapshot,
  name: string,
  options: { id?: string; now?: string } = {},
): BuildPlan {
  const now = options.now ?? new Date().toISOString();
  const id =
    options.id ??
    globalThis.crypto?.randomUUID?.() ??
    `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    name: name.trim() || "未命名方案",
    createdAt: now,
    updatedAt: now,
    snapshot: cloneBuildPlanSnapshot(snapshot),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function hasNumericKeys(
  value: unknown,
  keys: readonly string[],
): value is Record<string, number> {
  return (
    isRecord(value) &&
    keys.every(
      (key) =>
        typeof value[key] === "number" &&
        Number.isFinite(value[key] as number),
    )
  );
}

function isSnapshot(value: unknown): value is BuildPlanSnapshot {
  if (!isRecord(value)) return false;
  if (
    typeof value.element !== "string" ||
    typeof value.characterId !== "string" ||
    typeof value.weaponId !== "string" ||
    typeof value.weaponRefinement !== "number" ||
    typeof value.artifactSetId !== "string" ||
    ![0, 2, 4].includes(Number(value.artifactSetPieces)) ||
    !isStringRecord(value.weaponPassiveSelections) ||
    !isStringRecord(value.artifactSetSelections)
  ) {
    return false;
  }

  if (
    !hasNumericKeys(value.artifact, [
      "flatHp",
      "flatAtk",
      "flatDef",
      "critRate",
      "critDmg",
      "energyRecharge",
      "elementalMastery",
      "elementalDmg",
      "healingBonus",
    ]) ||
    !hasNumericKeys(value.talentBonuses, [
      "skill",
      "burst",
      "normal",
      "charged",
      "plunge",
    ])
  ) {
    return false;
  }

  const settings = value.damageSettings;
  return (
    isRecord(settings) &&
    hasNumericKeys(settings, [
      "enemyLevel",
      "enemyResistance",
      "normalTalentLevel",
      "skillTalentLevel",
      "burstTalentLevel",
    ]) &&
    isStringRecord(settings.selections)
  );
}

export function parseBuildPlanStore(raw: string | null): BuildPlanStore | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      ![1, buildPlansSchemaVersion].includes(
        Number(parsed.schemaVersion),
      ) ||
      !Array.isArray(parsed.plans)
    ) {
      return null;
    }

    const plans: BuildPlan[] = [];
    for (const plan of parsed.plans) {
      if (
        !isRecord(plan) ||
        typeof plan.id !== "string" ||
        typeof plan.name !== "string" ||
        typeof plan.createdAt !== "string" ||
        typeof plan.updatedAt !== "string" ||
        !isSnapshot(plan.snapshot)
      ) {
        return null;
      }
      plans.push({
        id: plan.id,
        name: plan.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        snapshot: cloneBuildPlanSnapshot(plan.snapshot),
      });
    }

    if (plans.length === 0) return null;

    const plansByCharacter = plans.reduce<Record<string, BuildPlan[]>>(
      (groups, plan) => {
        (groups[plan.snapshot.characterId] ??= []).push(plan);
        return groups;
      },
      {},
    );

    if (parsed.schemaVersion === 1) {
      if (typeof parsed.activePlanId !== "string") return null;
      const legacyActivePlan = plans.find(
        (plan) => plan.id === parsed.activePlanId,
      );
      if (!legacyActivePlan) return null;

      return {
        schemaVersion: buildPlansSchemaVersion,
        activeCharacterId: legacyActivePlan.snapshot.characterId,
        activePlanIds: Object.fromEntries(
          Object.entries(plansByCharacter).map(
            ([characterId, characterPlans]) => [
              characterId,
              characterId === legacyActivePlan.snapshot.characterId
                ? legacyActivePlan.id
                : characterPlans[0].id,
            ],
          ),
        ),
        plans,
      };
    }

    if (
      typeof parsed.activeCharacterId !== "string" ||
      !isStringRecord(parsed.activePlanIds)
    ) {
      return null;
    }

    const activePlanIds = Object.fromEntries(
      Object.entries(plansByCharacter).map(
        ([characterId, characterPlans]) => {
          const requestedId = parsed.activePlanIds[characterId];
          const requestedPlan = characterPlans.find(
            (plan) => plan.id === requestedId,
          );
          return [characterId, requestedPlan?.id ?? characterPlans[0].id];
        },
      ),
    );
    const activeCharacterId = plansByCharacter[parsed.activeCharacterId]
      ? parsed.activeCharacterId
      : plans[0].snapshot.characterId;

    return {
      schemaVersion: buildPlansSchemaVersion,
      activeCharacterId,
      activePlanIds,
      plans,
    };
  } catch {
    return null;
  }
}
