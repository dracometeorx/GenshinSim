import { calculateFinalPanel, type BuildInput, type FinalPanel } from "./calculator.ts";
import { restorePlanSnapshot } from "./build-plan-runtime.ts";
import type { BuildPlan } from "./build-plans.ts";
import { getConstellationCalculationState } from "./constellations.ts";
import { resolveArtifactModifiers } from "./data/artifacts/index.ts";
import type { ArtifactSetPreset } from "./data/artifacts/types.ts";
import type { CharacterPreset } from "./data/characters/types.ts";
import { characters } from "./data/characters/index.ts";
import { elementalResonances } from "./data/resonances.ts";
import type { WeaponPreset } from "./data/weapons/types.ts";
import { weapons } from "./data/weapons/index.ts";
import { getArtifactSet } from "./data/artifacts/index.ts";
import type { DamageSettings } from "./damage-types.ts";
import type {
  DamageEffect,
  PanelEffect,
  PanelModifier,
} from "./effects.ts";
import type {
  ResolvedTeamBuff,
  TeamBuffDefinition,
  TeamBuffEvaluationContext,
  TeamBuffModifier,
  TeamConfiguration,
  TeamBuffSourceKind,
} from "./team-types.ts";
import { createEmptyTeamConfiguration } from "./team-types.ts";

export interface CalculationTeamMember {
  slot: number;
  planId: string;
  constellation: number;
  build: BuildInput;
  character: CharacterPreset;
  weapon: WeaponPreset;
  artifactSet: ArtifactSetPreset;
  settings: DamageSettings;
}

export interface TeamCalculationInput {
  members: readonly CalculationTeamMember[];
  configuration: TeamConfiguration;
}

export function createTeamCalculationInput(
  configuration: TeamConfiguration,
  plans: readonly BuildPlan[],
): TeamCalculationInput {
  const members = configuration.slots.flatMap(
    (slot, index): CalculationTeamMember[] => {
      if (!slot.characterId) return [];
      const plan =
        plans.find(
          (item) =>
            item.id === slot.planId &&
            item.snapshot.characterId === slot.characterId,
        ) ??
        plans.find(
          (item) =>
            item.snapshot.characterId === slot.characterId,
        );
      if (!plan) return [];
      const draft = restorePlanSnapshot(plan.snapshot);
      const character = characters.find(
        (item) => item.id === draft.characterId,
      );
      const weaponPreset = weapons.find(
        (item) => item.id === draft.weaponId,
      );
      if (!character || !weaponPreset) return [];
      return [
        {
          slot: index,
          planId: plan.id,
          constellation: draft.constellation,
          build: draft.build,
          character,
          weapon: {
            ...weaponPreset,
            refinement: draft.build.weapon.refinement,
          },
          artifactSet: getArtifactSet(
            draft.build.artifactSetId,
          ),
          settings: draft.damageSettings,
        },
      ];
    },
  );
  return { members, configuration };
}

function calculateStandalonePanel(
  member: Omit<CalculationTeamMember, "slot" | "planId">,
) {
  const constellationState = getConstellationCalculationState(
    member.character,
    member.constellation,
    member.settings,
  );
  return calculateFinalPanel(member.build, {
    artifactModifiers: resolveArtifactModifiers(
      member.artifactSet,
      member.build.artifactSetPieces,
      member.build.artifactSetSelections,
      true,
    ),
    panelEffects: [
      ...(member.weapon.passive.panelEffects ?? []),
      ...(member.character.panelEffects ?? []),
      ...constellationState.panelEffects,
    ],
    damageSettings: constellationState.settings,
    includeConditionalEffects: true,
  });
}

function matchesDefinition(
  definition: TeamBuffDefinition,
  constellation: number,
  artifactPieces?: 0 | 2 | 4,
) {
  if (
    definition.minConstellation &&
    constellation < definition.minConstellation
  ) {
    return false;
  }
  if (
    definition.minArtifactPieces &&
    (artifactPieces ?? 0) < definition.minArtifactPieces
  ) {
    return false;
  }
  return true;
}

function createResolvedBuff({
  definition,
  id,
  sourceKind,
  sourceName,
  context,
  configuration,
}: {
  definition: TeamBuffDefinition;
  id: string;
  sourceKind: TeamBuffSourceKind;
  sourceName: string;
  context: TeamBuffEvaluationContext;
  configuration: TeamConfiguration;
}): ResolvedTeamBuff | null {
  const modifiers = definition
    .evaluate(context)
    .filter((modifier) => Number.isFinite(modifier.value));
  if (!modifiers.length) return null;
  return {
    id,
    sourceKind,
    sourceName,
    name: definition.name,
    description: definition.description,
    enabled: configuration.buffToggles[id] ?? true,
    modifiers,
  };
}

function createContext(
  source: {
    character: CharacterPreset;
    constellation: number;
    element: BuildInput["element"];
    panel: FinalPanel;
    settings: DamageSettings;
    weapon: WeaponPreset;
  },
  target: {
    character: CharacterPreset;
    build: BuildInput;
  },
  party: {
    highestElementalMastery: number;
    elements: readonly BuildInput["element"][];
  },
): TeamBuffEvaluationContext {
  return {
    source: {
      characterId: source.character.id,
      constellation: source.constellation,
      element: source.element,
      panel: source.panel,
      settings: source.settings,
      weaponRefinement: source.weapon.refinement,
    },
    target: {
      characterId: target.character.id,
      element: target.build.element,
      burstEnergyCost: target.character.burstEnergyCost ?? 60,
    },
    party,
  };
}

export function resolveTeamBuffs({
  target,
  targetConstellation,
  targetPanel,
  settings,
  team,
}: {
  target: {
    build: BuildInput;
    character: CharacterPreset;
    weapon: WeaponPreset;
    artifactSet: ArtifactSetPreset;
  };
  targetConstellation: number;
  targetPanel: FinalPanel;
  settings: DamageSettings;
  team?: TeamCalculationInput;
}) {
  const configuration =
    team?.configuration ?? createEmptyTeamConfiguration();
  const members = team?.members ?? [];
  const sourcePanels = members.map((member) => {
    const constellationState = getConstellationCalculationState(
      member.character,
      member.constellation,
      member.settings,
    );
    return {
      member,
      panel: calculateStandalonePanel(member),
      settings: constellationState.settings,
    };
  });
  const party = {
    highestElementalMastery: Math.max(
      targetPanel.elementalMastery,
      ...sourcePanels.map(({ panel }) => panel.elementalMastery),
    ),
    elements: [
      target.build.element,
      ...members.map((member) => member.build.element),
    ],
  };
  const buffs: ResolvedTeamBuff[] = [];
  const occupiedStackingGroups = new Set(
    target.build.artifactSetPieces === 4
      ? (target.artifactSet.teamBuffs ?? [])
          .map((definition) => definition.stackingGroup)
          .filter((group): group is string => Boolean(group))
      : [],
  );
  const targetContext = createContext(
    {
      character: target.character,
      constellation: targetConstellation,
      element: target.build.element,
      panel: targetPanel,
      settings,
      weapon: target.weapon,
    },
    target,
    party,
  );

  for (const definition of target.character.teamBuffs ?? []) {
    if (
      !definition.appliesToSelf ||
      !matchesDefinition(definition, targetConstellation)
    ) {
      continue;
    }
    const buff = createResolvedBuff({
      definition,
      id: `self:character:${definition.id}`,
      sourceKind: definition.minConstellation
        ? "constellation"
        : "character",
      sourceName: definition.minConstellation
        ? `${target.character.name}命座`
        : target.character.name,
      context: targetContext,
      configuration,
    });
    if (buff) buffs.push(buff);
  }

  for (const { member, panel, settings: sourceSettings } of sourcePanels) {
    const context = createContext(
      {
        character: member.character,
        constellation: member.constellation,
        element: member.build.element,
        panel,
        settings: sourceSettings,
        weapon: member.weapon,
      },
      target,
      party,
    );
    for (const definition of member.character.teamBuffs ?? []) {
      if (
        definition.appliesToTeammates === false ||
        !matchesDefinition(definition, member.constellation)
      ) {
        continue;
      }
      const buff = createResolvedBuff({
        definition,
        id: `slot:${member.slot}:character:${definition.id}`,
        sourceKind: "character",
        sourceName: member.character.name,
        context,
        configuration,
      });
      if (buff) buffs.push(buff);
    }
    for (const definition of member.weapon.passive.teamBuffs ?? []) {
      const buff = createResolvedBuff({
        definition,
        id: `slot:${member.slot}:weapon:${definition.id}`,
        sourceKind: "weapon",
        sourceName: member.weapon.name,
        context,
        configuration,
      });
      if (buff) buffs.push(buff);
    }
    for (const definition of member.artifactSet.teamBuffs ?? []) {
      if (
        (definition.stackingGroup &&
          occupiedStackingGroups.has(definition.stackingGroup)) ||
        !matchesDefinition(
          definition,
          member.constellation,
          member.build.artifactSetPieces,
        )
      ) {
        continue;
      }
      const buff = createResolvedBuff({
        definition,
        id: `slot:${member.slot}:artifact:${definition.id}`,
        sourceKind: "artifact",
        sourceName: member.artifactSet.shortName,
        context,
        configuration,
      });
      if (buff) {
        buffs.push(buff);
        if (definition.stackingGroup) {
          occupiedStackingGroups.add(definition.stackingGroup);
        }
      }
    }
  }

  for (const resonance of elementalResonances) {
    const elementCount = party.elements.filter(
      (element) => element === resonance.element,
    ).length;
    if (elementCount < 2) continue;
    for (const definition of resonance.buffs) {
      const buff = createResolvedBuff({
        definition,
        id: `resonance:${definition.id}`,
        sourceKind: "resonance",
        sourceName: "元素共鸣",
        context: targetContext,
        configuration,
      });
      if (buff) buffs.push(buff);
    }
  }

  const activeModifiers = buffs
    .filter((buff) => buff.enabled)
    .flatMap((buff) => buff.modifiers);
  const panelModifiers: PanelModifier[] = activeModifiers
    .filter(
      (
        modifier,
      ): modifier is Extract<TeamBuffModifier, { kind: "panel" }> =>
        modifier.kind === "panel",
    )
    .map(({ stat, value }) => ({ stat, value }));
  const damageModifiers = activeModifiers.filter(
    (
      modifier,
    ): modifier is Extract<TeamBuffModifier, { kind: "damage" }> =>
      modifier.kind === "damage",
  );
  const panelEffects: PanelEffect[] = panelModifiers.length
    ? [
        {
          id: "active-team-panel-buffs",
          stage: "additive",
          conditional: true,
          evaluate: () => panelModifiers,
        },
      ]
    : [];
  const damageEffects: DamageEffect[] = damageModifiers.length
    ? [
        {
          id: "active-team-damage-buffs",
          evaluate: ({ target: damageTarget }) =>
            damageModifiers
              .filter(
                (modifier) =>
                  (!modifier.category ||
                    modifier.category === damageTarget.category) &&
                  (!modifier.element ||
                    modifier.element === target.build.element),
              )
              .map((modifier) => ({
                stat: modifier.stat,
                value: modifier.value,
                category: modifier.category,
                element: modifier.element,
                reactions: modifier.reactions,
              })),
        },
      ]
    : [];

  return { buffs, panelEffects, damageEffects };
}
