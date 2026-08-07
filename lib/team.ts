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
import { getPolestarElementalDamageBonus } from "./damage.ts";
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

export type MoonsignLevel = "none" | "nascent" | "ascendant";

export function getCharacterMoonsignLevels(character: CharacterPreset) {
  if (typeof character.moonsignLevels === "number") {
    return Math.max(0, Math.round(character.moonsignLevels));
  }
  return character.moonsign ? 1 : 0;
}

export function deriveMoonsignState(
  target: CharacterPreset,
  members: readonly Pick<CalculationTeamMember, "character">[],
) {
  const count =
    getCharacterMoonsignLevels(target) +
    members.reduce(
      (total, member) =>
        total + getCharacterMoonsignLevels(member.character),
      0,
    );
  const level: MoonsignLevel =
    count >= 2 ? "ascendant" : count >= 1 ? "nascent" : "none";
  return { count, level };
}

export function deriveHexereiState(
  target: CharacterPreset,
  members: readonly Pick<CalculationTeamMember, "character">[],
) {
  const uniqueCharacters = new Map(
    [target, ...members.map(({ character }) => character)].map(
      (character) => [character.id, character],
    ),
  );
  const count = [...uniqueCharacters.values()].filter(
    (character) => character.hexerei,
  ).length;
  return { count, secretRite: count >= 2 };
}

export function deriveStellarConductState(
  target: CharacterPreset,
  members: readonly Pick<CalculationTeamMember, "character">[],
  settings: DamageSettings,
) {
  const uniqueCharacters = new Map(
    [target, ...members.map(({ character }) => character)].map(
      (character) => [character.id, character],
    ),
  );
  const partyCharacters = [...uniqueCharacters.values()];
  const enablerCount = partyCharacters.filter(
    (character) => character.stellarConduct === "enabler",
  ).length;
  const hasCryo = partyCharacters.some(
    (character) => character.element === "cryo",
  );
  const hasElectro = partyCharacters.some(
    (character) => character.element === "electro",
  );
  const active = enablerCount > 0 && hasCryo && hasElectro;
  const rawPower = Number(
    settings.selections.stellarElementalPower ?? "12",
  );
  const elementalPower = active
    ? Math.min(
        12,
        Math.max(
          0,
          Number.isFinite(rawPower) ? Math.round(rawPower) : 12,
        ),
      )
    : 0;
  return { enablerCount, active, elementalPower };
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
  moonsignLevel: MoonsignLevel,
  hexereiSecretRite: boolean,
  partyPanelModifiers: readonly PanelModifier[] = [],
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
      {
        moonsignLevel,
        witchHomeworkCompleted: Boolean(member.character.hexerei),
        hexereiSecretRite,
        characterElement: member.character.element,
      },
    ),
    panelEffects: [
      ...(member.weapon.passive.panelEffects ?? []),
      ...(member.character.panelEffects ?? []),
      ...constellationState.panelEffects,
      ...(partyPanelModifiers.length
        ? [
            {
              id: "pre-conversion-party-panel-buffs",
              stage: "additive" as const,
              conditional: true,
              evaluate: () => partyPanelModifiers,
            },
          ]
        : []),
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
  const toggleable = definition.toggleable !== false;
  return {
    id,
    sourceKind,
    sourceName,
    name: definition.name,
    description: definition.description,
    toggleable,
    enabled: toggleable
      ? (configuration.buffToggles[id] ?? true)
      : true,
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
    weaponSelections: Readonly<Record<string, string>>;
    artifactSelections: Readonly<Record<string, string>>;
  },
  target: {
    character: CharacterPreset;
    build: BuildInput;
  },
  party: {
    highestElementalMastery: number;
    elements: readonly BuildInput["element"][];
    moonsignCount: number;
    moonsignLevel: MoonsignLevel;
    hexereiCount: number;
    hexereiSecretRite: boolean;
    stellarConductActive: boolean;
    stellarConductEnablerCount: number;
    stellarElementalPower: number;
  },
): TeamBuffEvaluationContext {
  return {
    source: {
      characterId: source.character.id,
      moonsign: getCharacterMoonsignLevels(source.character) > 0,
      hexerei: Boolean(source.character.hexerei),
      stellarConductEnabler:
        source.character.stellarConduct === "enabler",
      stellarConductRelated: Boolean(
        source.character.stellarConduct,
      ),
      constellation: source.constellation,
      element: source.element,
      panel: source.panel,
      settings: source.settings,
      weaponRefinement: source.weapon.refinement,
      weaponSelections: source.weaponSelections,
      artifactSelections: source.artifactSelections,
    },
    target: {
      characterId: target.character.id,
      element: target.build.element,
      burstEnergyCost: target.character.burstEnergyCost ?? 60,
      moonsign: getCharacterMoonsignLevels(target.character) > 0,
      hexerei: Boolean(target.character.hexerei),
      stellarConductEnabler:
        target.character.stellarConduct === "enabler",
      stellarConductRelated: Boolean(
        target.character.stellarConduct,
      ),
    },
    party,
  };
}

const moonsignTeamBonus: TeamBuffDefinition = {
  id: "ascendant-gleam-team-bonus",
  name: "月兆·满辉队伍增益",
  description:
    "非月兆角色施放元素战技或元素爆发后，按其元素对应属性提高全队月曜反应伤害，至多 36%；多个来源不叠加。",
  stackingGroup: "ascendant-gleam-team-bonus",
  evaluate: ({ source, party }) => {
    if (party.moonsignLevel !== "ascendant" || source.moonsign) {
      return [];
    }
    let value = 0;
    if (
      source.element === "pyro" ||
      source.element === "electro" ||
      source.element === "cryo"
    ) {
      value = (source.panel.atk / 100) * 0.9;
    } else if (source.element === "hydro") {
      value = (source.panel.hp / 1000) * 0.6;
    } else if (source.element === "geo") {
      value = source.panel.def / 100;
    } else {
      value = (source.panel.elementalMastery / 100) * 2.25;
    }
    return [
      {
        kind: "damage",
        stat: "lunarReactionDamageBonus",
        value: Math.min(36, Math.max(0, value)),
      },
    ];
  },
};

const polestarFieldElementalBonus: TeamBuffDefinition = {
  id: "polestar-field-elemental-bonus",
  name: "星极场·冰雷增伤",
  description:
    "星极场按当前元素力提高冰元素与雷元素普通伤害；该增益不进入星电导直伤乘区。",
  appliesToSelf: true,
  evaluate: ({ target, party }) => {
    if (
      !party.stellarConductActive ||
      (target.element !== "cryo" && target.element !== "electro")
    ) {
      return [];
    }
    return [
      {
        kind: "panel",
        stat: "elementalDmg",
        value: getPolestarElementalDamageBonus(
          party.stellarElementalPower ?? 0,
        ),
      },
    ];
  },
};

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
  const moonsign = deriveMoonsignState(target.character, members);
  const hexerei = deriveHexereiState(target.character, members);
  const stellarConduct = deriveStellarConductState(
    target.character,
    members,
    settings,
  );
  const preliminarySourcePanels = members.map((member) => {
    const constellationState = getConstellationCalculationState(
      member.character,
      member.constellation,
      member.settings,
    );
    return {
      member,
      panel: calculateStandalonePanel(
        member,
        moonsign.level,
        hexerei.secretRite,
      ),
      settings: constellationState.settings,
    };
  });
  const createPartyState = (
    panels: typeof preliminarySourcePanels,
  ) => ({
    highestElementalMastery: Math.max(
      targetPanel.elementalMastery,
      ...panels.map(({ panel }) => panel.elementalMastery),
    ),
    elements: [
      target.build.element,
      ...members.map((member) => member.build.element),
    ],
    moonsignCount: moonsign.count,
    moonsignLevel: moonsign.level,
    hexereiCount: hexerei.count,
    hexereiSecretRite: hexerei.secretRite,
    stellarConductActive: stellarConduct.active,
    stellarConductEnablerCount: stellarConduct.enablerCount,
    stellarElementalPower: stellarConduct.elementalPower,
  });
  const preliminaryParty = createPartyState(preliminarySourcePanels);

  type SourcePanelBuff = {
    key: string;
    modifiers: PanelModifier[];
  };
  const sourcePanelBuffs: SourcePanelBuff[] = [];
  const occupiedSourcePanelGroups = new Set<string>();
  const collectSourcePanelBuff = (
    definition: TeamBuffDefinition,
    id: string,
    context: TeamBuffEvaluationContext,
    constellation: number,
    artifactPieces: 0 | 2 | 4,
  ) => {
    if (
      !definition.contributesToBuffSourcePanel ||
      !matchesDefinition(definition, constellation, artifactPieces)
    ) {
      return;
    }
    const key = definition.stackingGroup ?? definition.id;
    if (occupiedSourcePanelGroups.has(key)) return;
    const modifiers = definition
      .evaluate(context)
      .filter(
        (modifier): modifier is Extract<
          TeamBuffModifier,
          { kind: "panel" }
        > => modifier.kind === "panel" && Number.isFinite(modifier.value),
      )
      .map(({ stat, value }) => ({ stat, value }));
    if (!modifiers.length) return;
    occupiedSourcePanelGroups.add(key);
    const enabled =
      definition.toggleable === false ||
      (configuration.buffToggles[id] ?? true);
    if (enabled) sourcePanelBuffs.push({ key, modifiers });
  };

  const preliminaryTargetContext = createContext(
    {
      character: target.character,
      constellation: targetConstellation,
      element: target.build.element,
      panel: targetPanel,
      settings,
      weapon: target.weapon,
      weaponSelections: target.build.weaponPassiveSelections ?? {},
      artifactSelections: target.build.artifactSetSelections ?? {},
    },
    target,
    preliminaryParty,
  );
  for (const definition of target.artifactSet.teamBuffs ?? []) {
    collectSourcePanelBuff(
      definition,
      `self:artifact:${definition.id}`,
      preliminaryTargetContext,
      targetConstellation,
      target.build.artifactSetPieces,
    );
  }
  for (const {
    member,
    panel,
    settings: sourceSettings,
  } of preliminarySourcePanels) {
    const context = createContext(
      {
        character: member.character,
        constellation: member.constellation,
        element: member.build.element,
        panel,
        settings: sourceSettings,
        weapon: member.weapon,
        weaponSelections: member.build.weaponPassiveSelections ?? {},
        artifactSelections: member.build.artifactSetSelections ?? {},
      },
      target,
      preliminaryParty,
    );
    for (const definition of member.artifactSet.teamBuffs ?? []) {
      collectSourcePanelBuff(
        definition,
        `slot:${member.slot}:artifact:${definition.id}`,
        context,
        member.constellation,
        member.build.artifactSetPieces,
      );
    }
  }

  const sourcePanels = preliminarySourcePanels.map(
    ({ member, panel: preliminaryPanel, settings: sourceSettings }) => {
      const ownContext = createContext(
        {
          character: member.character,
          constellation: member.constellation,
          element: member.build.element,
          panel: preliminaryPanel,
          settings: sourceSettings,
          weapon: member.weapon,
          weaponSelections: member.build.weaponPassiveSelections ?? {},
          artifactSelections: member.build.artifactSetSelections ?? {},
        },
        target,
        preliminaryParty,
      );
      const ownSourcePanelBuffKeys = new Set(
        (member.artifactSet.teamBuffs ?? [])
          .filter(
            (definition) =>
              definition.contributesToBuffSourcePanel &&
              matchesDefinition(
                definition,
                member.constellation,
                member.build.artifactSetPieces,
              ) &&
              definition
                .evaluate(ownContext)
                .some(
                  (modifier) =>
                    modifier.kind === "panel" &&
                    Number.isFinite(modifier.value),
                ),
          )
          .map(
            (definition) => definition.stackingGroup ?? definition.id,
          ),
      );
      const externalModifiers = sourcePanelBuffs.flatMap((buff) =>
        ownSourcePanelBuffKeys.has(buff.key) ? [] : buff.modifiers,
      );
      return {
        member,
        panel: externalModifiers.length
          ? calculateStandalonePanel(
              member,
              moonsign.level,
              hexerei.secretRite,
              externalModifiers,
            )
          : preliminaryPanel,
        settings: sourceSettings,
      };
    },
  );
  const party = createPartyState(sourcePanels);
  const buffs: ResolvedTeamBuff[] = [];
  const targetContext = createContext(
    {
      character: target.character,
      constellation: targetConstellation,
      element: target.build.element,
      panel: targetPanel,
      settings,
      weapon: target.weapon,
      weaponSelections: target.build.weaponPassiveSelections ?? {},
      artifactSelections: target.build.artifactSetSelections ?? {},
    },
    target,
    party,
  );
  const occupiedStackingGroups = new Set<string>();
  if (target.build.artifactSetPieces === 4) {
    for (const definition of target.artifactSet.teamBuffs ?? []) {
      if (
        definition.stackingGroup &&
        matchesDefinition(
          definition,
          targetConstellation,
          target.build.artifactSetPieces,
        ) &&
        definition.evaluate(targetContext).some((modifier) =>
          Number.isFinite(modifier.value),
        )
      ) {
        occupiedStackingGroups.add(definition.stackingGroup);
      }
    }
  }
  const addResolvedBuff = (
    definition: TeamBuffDefinition,
    options: Omit<
      Parameters<typeof createResolvedBuff>[0],
      "definition" | "configuration"
    >,
  ) => {
    if (
      definition.stackingGroup &&
      occupiedStackingGroups.has(definition.stackingGroup)
    ) {
      return;
    }
    const buff = createResolvedBuff({
      ...options,
      definition,
      configuration,
    });
    if (!buff) return;
    buffs.push(buff);
    if (definition.stackingGroup) {
      occupiedStackingGroups.add(definition.stackingGroup);
    }
  };
  for (const definition of target.character.teamBuffs ?? []) {
    if (
      !definition.appliesToSelf ||
      !matchesDefinition(definition, targetConstellation)
    ) {
      continue;
    }
    addResolvedBuff(definition, {
      id: `self:character:${definition.id}`,
      sourceKind: definition.minConstellation
        ? "constellation"
        : "character",
      sourceName: definition.minConstellation
        ? `${target.character.name}命座`
        : target.character.name,
      context: targetContext,
    });
  }
  addResolvedBuff(polestarFieldElementalBonus, {
    id: `reaction:${polestarFieldElementalBonus.id}`,
    sourceKind: "reaction",
    sourceName: "星极场",
    context: targetContext,
  });

  for (const definition of target.weapon.passive.teamBuffs ?? []) {
    if (!definition.appliesToSelf) continue;
    addResolvedBuff(definition, {
      id: `self:weapon:${definition.id}`,
      sourceKind: "weapon",
      sourceName: target.weapon.name,
      context: targetContext,
    });
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
        weaponSelections:
          member.build.weaponPassiveSelections ?? {},
        artifactSelections:
          member.build.artifactSetSelections ?? {},
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
      addResolvedBuff(definition, {
        id: `slot:${member.slot}:character:${definition.id}`,
        sourceKind: "character",
        sourceName: member.character.name,
        context,
      });
    }
    for (const definition of member.weapon.passive.teamBuffs ?? []) {
      if (definition.appliesToTeammates === false) continue;
      addResolvedBuff(definition, {
        id: `slot:${member.slot}:weapon:${definition.id}`,
        sourceKind: "weapon",
        sourceName: member.weapon.name,
        context,
      });
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
      addResolvedBuff(definition, {
        id: `slot:${member.slot}:artifact:${definition.id}`,
        sourceKind: "artifact",
        sourceName: member.artifactSet.shortName,
        context,
      });
    }
    if (!getCharacterMoonsignLevels(member.character)) {
      addResolvedBuff(moonsignTeamBonus, {
        id: `slot:${member.slot}:character:${moonsignTeamBonus.id}`,
        sourceKind: "character",
        sourceName: member.character.name,
        context,
      });
    }
  }

  for (const resonance of elementalResonances) {
    const elementCount = party.elements.filter(
      (element) => element === resonance.element,
    ).length;
    if (elementCount < 2) continue;
    for (const definition of resonance.buffs) {
      addResolvedBuff(definition, {
        id: `resonance:${definition.id}`,
        sourceKind: "resonance",
        sourceName: "元素共鸣",
        context: targetContext,
      });
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
                    modifier.element ===
                      (damageTarget.damageElement ??
                        target.build.element)) &&
                  (!modifier.lunarReactions?.length ||
                    (damageTarget.model?.kind === "directLunar" &&
                      modifier.lunarReactions.includes(
                        damageTarget.model.reaction,
                      ))) &&
                  (!modifier.stellarReactions?.length ||
                    (damageTarget.model?.kind === "directStellar" &&
                      modifier.stellarReactions.includes(
                        damageTarget.model.reaction,
                      ))),
              )
              .map((modifier) => ({
                stat: modifier.stat,
                value: modifier.value,
                category: modifier.category,
                element: modifier.element,
                reactions: modifier.reactions,
                lunarReactions: modifier.lunarReactions,
                stellarReactions: modifier.stellarReactions,
              })),
        },
      ]
    : [];

  return {
    buffs,
    panelEffects,
    damageEffects,
    moonsign: {
      count: party.moonsignCount,
      level: party.moonsignLevel,
    },
    hexerei: {
      count: party.hexereiCount,
      secretRite: party.hexereiSecretRite,
    },
    stellarConduct: {
      enablerCount: party.stellarConductEnablerCount,
      active: party.stellarConductActive,
      elementalPower: party.stellarElementalPower,
    },
  };
}
