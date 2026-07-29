import {
  restorePlanSnapshot,
  type BuildPlanDraft,
} from "./build-plan-runtime.ts";
import type { BuildPlan } from "./build-plans.ts";
import {
  calculateBuild,
  type CalculationResult,
} from "./calculation.ts";
import { getArtifactSet } from "./data/artifacts/index.ts";
import { characters } from "./data/characters/index.ts";
import { weapons } from "./data/weapons/index.ts";
import { createTeamCalculationInput } from "./team.ts";

export interface BuildComparisonDamage {
  id: string;
  skillName: string;
  variantLabel: string;
  nonCrit: number;
  crit: number;
  expected: number;
}

export interface BuildComparisonTeammate {
  planId: string;
  planName: string;
  characterName: string;
  constellation: number;
  weaponName: string;
  weaponRefinement: number;
  artifactName: string;
  artifactPieces: 0 | 2 | 4;
}

export interface BuildComparisonEntry {
  plan: BuildPlan;
  characterId: string;
  characterName: string;
  element: string;
  constellation: number;
  weaponName: string;
  weaponRefinement: number;
  artifactName: string;
  artifactPieces: 0 | 2 | 4;
  teammates: BuildComparisonTeammate[];
  calculation: CalculationResult;
  damages: BuildComparisonDamage[];
  primaryDamage: BuildComparisonDamage | null;
}

function resolveTeammates(
  team: BuildPlanDraft["team"],
  plans: readonly BuildPlan[],
): BuildComparisonTeammate[] {
  return team.slots.flatMap((slot) => {
    if (!slot.characterId) return [];
    const teammatePlan =
      plans.find(
        (candidate) =>
          candidate.id === slot.planId &&
          candidate.snapshot.characterId === slot.characterId,
      ) ??
      plans.find(
        (candidate) =>
          candidate.snapshot.characterId === slot.characterId,
      );
    if (!teammatePlan) return [];
    const draft = restorePlanSnapshot(teammatePlan.snapshot);
    const artifactSet = getArtifactSet(
      draft.build.artifactSetId,
    );
    return [
      {
        planId: teammatePlan.id,
        planName: teammatePlan.name,
        characterName: draft.build.character.name,
        constellation: draft.constellation,
        weaponName: draft.build.weapon.name,
        weaponRefinement: draft.build.weapon.refinement,
        artifactName: artifactSet.shortName,
        artifactPieces: draft.build.artifactSetPieces ?? 0,
      },
    ];
  });
}

export function createBuildComparisonEntry(
  plan: BuildPlan,
  plans: readonly BuildPlan[],
): BuildComparisonEntry {
  const draft = restorePlanSnapshot(plan.snapshot);
  const character =
    characters.find(
      (candidate) => candidate.id === draft.characterId,
    ) ?? characters[0];
  const weapon =
    weapons.find((candidate) => candidate.id === draft.weaponId) ??
    weapons[0];
  const artifactSet = getArtifactSet(
    draft.build.artifactSetId,
  );
  const calculation = calculateBuild({
    build: draft.build,
    character,
    weapon,
    artifactSet,
    settings: draft.damageSettings,
    constellation: draft.constellation,
    team: createTeamCalculationInput(draft.team, plans),
  });
  const damages = calculation.skills.flatMap((skill) =>
    skill.variants.map((variant) => ({
      id: `${skill.id}:${variant.reaction}`,
      skillName: skill.name,
      variantLabel: variant.label,
      nonCrit: variant.nonCrit,
      crit: variant.crit,
      expected: variant.expected,
    })),
  );
  const primaryDamage =
    damages.reduce<BuildComparisonDamage | null>(
      (highest, damage) =>
        !highest || damage.expected > highest.expected
          ? damage
          : highest,
      null,
    );

  return {
    plan,
    characterId: draft.characterId,
    characterName: character.name,
    element: draft.build.element,
    constellation: draft.constellation,
    weaponName: draft.build.weapon.name,
    weaponRefinement: draft.build.weapon.refinement,
    artifactName: artifactSet.shortName,
    artifactPieces: draft.build.artifactSetPieces ?? 0,
    teammates: resolveTeammates(draft.team, plans),
    calculation,
    damages,
    primaryDamage,
  };
}

export function createBuildComparisonEntries(
  plans: readonly BuildPlan[],
) {
  return plans.map((plan) =>
    createBuildComparisonEntry(plan, plans),
  );
}
