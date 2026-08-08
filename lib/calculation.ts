import {
  calculateFinalPanel,
  type BuildInput,
  type FinalPanel,
} from "./calculator.ts";
import {
  calculateRepresentativeDamage,
  type DamageCalculationResult,
  type DamageSettings,
} from "./damage.ts";
import {
  clampConstellation,
  getConstellationCalculationState,
} from "./constellations.ts";
import { resolveArtifactModifiers } from "./data/artifacts/index.ts";
import type { ArtifactSetPreset } from "./data/artifacts/types.ts";
import type { CharacterPreset } from "./data/characters/types.ts";
import type { WeaponPreset } from "./data/weapons/types.ts";
import {
  deriveHexereiState,
  deriveMoonsignState,
  resolveTeamBuffs,
  type TeamCalculationInput,
} from "./team.ts";
import type { ResolvedTeamBuff } from "./team-types.ts";

export type CalculationWarningCode =
  | "INCOMPATIBLE_BLIZZARD_MELT_CONDITION"
  | "LUNAR_TRANSFORMATIVE_DAMAGE_EXCLUDED"
  | "STELLAR_REACTION_TRIGGER_DAMAGE_EXCLUDED"
  | "STELLAR_CONDUCT_INACTIVE"
  | "CHARACTER_BUILD_NORMALIZED";

export interface CalculationWarning {
  code: CalculationWarningCode;
  message: string;
}

export interface CalculationRequest {
  build: BuildInput;
  character: CharacterPreset;
  weapon: WeaponPreset;
  artifactSet: ArtifactSetPreset;
  settings: DamageSettings;
  constellation?: number;
  team?: TeamCalculationInput;
  analyzeArtifactSubstats?: boolean;
}

export type ArtifactSubstatKey =
  | "flatHp"
  | "hpPct"
  | "flatAtk"
  | "atkPct"
  | "flatDef"
  | "defPct"
  | "critRate"
  | "critDmg"
  | "energyRecharge"
  | "elementalMastery";

export interface ArtifactSubstatImpact {
  key: ArtifactSubstatKey;
  label: string;
  rollLabel: string;
  damageIncrease: number;
  percentIncrease: number;
}

export interface CalculationResult extends DamageCalculationResult {
  /** Current selected combat conditions; kept as the main display/export panel. */
  panel: FinalPanel;
  staticPanel: FinalPanel;
  combatPanel: FinalPanel;
  constellation: number;
  effectiveSettings: DamageSettings;
  teamBuffs: ResolvedTeamBuff[];
  moonsign: {
    count: number;
    level: "none" | "nascent" | "ascendant";
  };
  hexerei: {
    count: number;
    secretRite: boolean;
  };
  stellarConduct: {
    enablerCount: number;
    active: boolean;
    elementalPower: number;
  };
  artifactSubstatImpacts: ArtifactSubstatImpact[];
  warnings: CalculationWarning[];
}

type ArtifactSubstatRoll = {
  key: ArtifactSubstatKey;
  label: string;
  rollLabel: string;
  artifactKey: keyof BuildInput["artifact"];
  increment: (build: BuildInput) => number;
};

const averageArtifactSubstatRolls: ArtifactSubstatRoll[] = [
  {
    key: "flatHp",
    label: "生命值",
    rollLabel: "+254",
    artifactKey: "flatHp",
    increment: () => 253.94,
  },
  {
    key: "hpPct",
    label: "生命值%",
    rollLabel: "+5.0%",
    artifactKey: "flatHp",
    increment: (build) => build.character.baseHp * 0.04955,
  },
  {
    key: "flatAtk",
    label: "攻击力",
    rollLabel: "+17",
    artifactKey: "flatAtk",
    increment: () => 16.535,
  },
  {
    key: "atkPct",
    label: "攻击力%",
    rollLabel: "+5.0%",
    artifactKey: "flatAtk",
    increment: (build) =>
      (build.character.baseAtk + build.weapon.baseAtk) * 0.04955,
  },
  {
    key: "flatDef",
    label: "防御力",
    rollLabel: "+20",
    artifactKey: "flatDef",
    increment: () => 19.675,
  },
  {
    key: "defPct",
    label: "防御力%",
    rollLabel: "+6.2%",
    artifactKey: "flatDef",
    increment: (build) => build.character.baseDef * 0.06195,
  },
  {
    key: "critRate",
    label: "暴击率",
    rollLabel: "+3.3%",
    artifactKey: "critRate",
    increment: () => 3.305,
  },
  {
    key: "critDmg",
    label: "暴击伤害",
    rollLabel: "+6.6%",
    artifactKey: "critDmg",
    increment: () => 6.605,
  },
  {
    key: "energyRecharge",
    label: "元素充能效率",
    rollLabel: "+5.5%",
    artifactKey: "energyRecharge",
    increment: () => 5.505,
  },
  {
    key: "elementalMastery",
    label: "元素精通",
    rollLabel: "+20",
    artifactKey: "elementalMastery",
    increment: () => 19.815,
  },
];

/**
 * Unified public calculation entry point.
 *
 * The selected catalog character is authoritative. This prevents callers from
 * combining one character's damage profile with another character's base
 * panel, while keeping custom user-controlled build values intact.
 */
export function calculateBuild({
  build,
  character,
  weapon,
  artifactSet,
  settings,
  constellation: requestedConstellation = 0,
  team,
  analyzeArtifactSubstats = false,
}: CalculationRequest): CalculationResult {
  const warnings: CalculationWarning[] = [];
  const characterMismatch =
    build.character.name !== character.name ||
    build.character.level !== character.level ||
    build.character.baseHp !== character.baseHp ||
    build.character.baseAtk !== character.baseAtk ||
    build.character.baseDef !== character.baseDef ||
    build.character.ascensionStat !== character.ascensionStat ||
    build.character.ascensionValue !== character.ascensionValue;
  const elementMismatch =
    character.id !== "custom" && build.element !== character.element;
  const resolvedCharacter =
    character.id === "custom" ? build.character : character;
  const resolvedWeapon: BuildInput["weapon"] =
    weapon.id === "custom"
      ? build.weapon
      : {
          ...weapon,
          level: build.weapon.level,
          refinement: Math.min(
            5,
            Math.max(1, Math.round(build.weapon.refinement)),
          ),
        };
  const normalizedBuild: BuildInput = {
    ...build,
    character: resolvedCharacter,
    weapon: resolvedWeapon,
    element:
      character.id === "custom" ? build.element : character.element,
    artifactSetId: artifactSet.id,
  };
  const constellation = clampConstellation(
    requestedConstellation,
  );
  const constellationState = getConstellationCalculationState(
    character,
    constellation,
    settings,
  );
  const effectiveSettings = constellationState.settings;
  const moonsign = deriveMoonsignState(
    character,
    team?.members ?? [],
  );
  const hexerei = deriveHexereiState(
    character,
    team?.members ?? [],
  );

  if (characterMismatch || elementMismatch) {
    warnings.push({
      code: "CHARACTER_BUILD_NORMALIZED",
      message: "角色目录与方案基础属性不一致，已使用当前角色目录数据计算。",
    });
  }

  const panelEffects = [
    ...(weapon.passive.panelEffects ?? []),
    ...(character.panelEffects ?? []),
    ...constellationState.panelEffects,
  ];
  const staticArtifactModifiers = resolveArtifactModifiers(
    artifactSet,
    normalizedBuild.artifactSetPieces,
    normalizedBuild.artifactSetSelections,
    false,
    {
      moonsignLevel: moonsign.level,
      witchHomeworkCompleted: Boolean(character.hexerei),
      hexereiSecretRite: hexerei.secretRite,
      characterElement: character.element,
    },
  );
  const combatArtifactModifiers = resolveArtifactModifiers(
    artifactSet,
    normalizedBuild.artifactSetPieces,
    normalizedBuild.artifactSetSelections,
    true,
    {
      moonsignLevel: moonsign.level,
      witchHomeworkCompleted: Boolean(character.hexerei),
      hexereiSecretRite: hexerei.secretRite,
      characterElement: character.element,
    },
  );
  const staticPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: staticArtifactModifiers,
    panelEffects,
    damageSettings: effectiveSettings,
    includeConditionalEffects: false,
  });
  const standaloneCombatPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: combatArtifactModifiers,
    panelEffects,
    damageSettings: effectiveSettings,
    includeConditionalEffects: true,
  });
  const resolvedTeam = resolveTeamBuffs({
    target: {
      build: normalizedBuild,
      character,
      weapon: {
        ...weapon,
        refinement: normalizedBuild.weapon.refinement,
      },
      artifactSet,
    },
    targetConstellation: constellation,
    targetPanel: standaloneCombatPanel,
    settings: effectiveSettings,
    team,
  });
  const combatPanel = calculateFinalPanel(normalizedBuild, {
    artifactModifiers: combatArtifactModifiers,
    panelEffects: [...panelEffects, ...resolvedTeam.panelEffects],
    damageSettings: effectiveSettings,
    includeConditionalEffects: true,
  });
  const damage = calculateRepresentativeDamage(
    character,
    normalizedBuild,
    combatPanel,
    effectiveSettings,
    combatArtifactModifiers,
    [
      ...(weapon.passive.damageEffects ?? []),
      ...constellationState.damageEffects,
      ...resolvedTeam.damageEffects,
    ],
    constellation,
    resolvedTeam.moonsign.level,
    resolvedTeam.hexerei.secretRite,
    resolvedTeam.stellarConduct.active,
    resolvedTeam.stellarConduct.elementalPower,
  );

  const selectedSkills = damage.selectedSkill
    ? [damage.selectedSkill]
    : [];
  const hasMeltVariant = selectedSkills.some((skill) =>
    skill.variants.some((variant) => variant.reaction === "melt"),
  );
  const hasDirectLunarDamage = selectedSkills.some(
    (skill) => skill.model === "directLunar",
  );
  if (hasDirectLunarDamage) {
    warnings.push({
      code: "LUNAR_TRANSFORMATIVE_DAMAGE_EXCLUDED",
      message:
        "月曜结果仅包含技能直接造成的月反应伤害，不包含雷暴云、草原核/月绽放产物或月笼等反应触发伤害。",
    });
  }
  const hasDirectStellarDamage = selectedSkills.some(
    (skill) => skill.model === "directStellar",
  );
  if (hasDirectStellarDamage) {
    warnings.push({
      code: "STELLAR_REACTION_TRIGGER_DAMAGE_EXCLUDED",
      message:
        "星电导反应本身不造成伤害；结果仅包含角色天赋或技能直接造成的星电导伤害。",
    });
  } else if (
    character.stellarConduct &&
    !resolvedTeam.stellarConduct.active
  ) {
    warnings.push({
      code: "STELLAR_CONDUCT_INACTIVE",
      message:
        "队伍需同时包含桑多涅、冰元素角色与雷元素角色才能建立星极场；当前不显示星电导直伤。",
    });
  }
  const blizzardState =
    normalizedBuild.artifactSetSelections?.blizzardEnemyState;
  if (
    artifactSet.id === "blizzard-strayer" &&
    normalizedBuild.artifactSetPieces === 4 &&
    hasMeltVariant &&
    (blizzardState === "cryo" || blizzardState === "frozen")
  ) {
    warnings.push({
      code: "INCOMPATIBLE_BLIZZARD_MELT_CONDITION",
      message:
        "融化需要火元素附着，不能同时享受冰影响或冻结条件暴击率；融化期望值已自动排除该加成。",
    });
  }

  const result: CalculationResult = {
    ...damage,
    panel: combatPanel,
    staticPanel,
    combatPanel,
    constellation,
    effectiveSettings,
    teamBuffs: resolvedTeam.buffs,
    moonsign: resolvedTeam.moonsign,
    hexerei: resolvedTeam.hexerei,
    stellarConduct: resolvedTeam.stellarConduct,
    artifactSubstatImpacts: [],
    warnings,
  };

  if (analyzeArtifactSubstats && damage.selectedSkill) {
    result.artifactSubstatImpacts = calculateArtifactSubstatImpacts({
      baseline: result,
      build: normalizedBuild,
      character,
      weapon,
      artifactSet,
      settings,
      constellation,
      team,
    });
  }

  return result;
}

function highestExpectedDamage(result: CalculationResult) {
  return Math.max(
    0,
    ...(result.selectedSkill?.variants.map(
      (variant) => variant.expected,
    ) ?? []),
  );
}

function calculateArtifactSubstatImpacts({
  baseline,
  build,
  character,
  weapon,
  artifactSet,
  settings,
  constellation,
  team,
}: {
  baseline: CalculationResult;
  build: BuildInput;
  character: CharacterPreset;
  weapon: WeaponPreset;
  artifactSet: ArtifactSetPreset;
  settings: DamageSettings;
  constellation: number;
  team?: TeamCalculationInput;
}) {
  const baselineExpected = highestExpectedDamage(baseline);
  if (baselineExpected <= 0) return [];

  return averageArtifactSubstatRolls
    .map((roll): ArtifactSubstatImpact => {
      const increment = roll.increment(build);
      const nextBuild: BuildInput = {
        ...build,
        artifact: {
          ...build.artifact,
          [roll.artifactKey]:
            build.artifact[roll.artifactKey] + increment,
        },
      };
      const next = calculateBuild({
        build: nextBuild,
        character,
        weapon,
        artifactSet,
        settings,
        constellation,
        team,
        analyzeArtifactSubstats: false,
      });
      const damageIncrease = Math.max(
        0,
        highestExpectedDamage(next) - baselineExpected,
      );
      return {
        key: roll.key,
        label: roll.label,
        rollLabel: roll.rollLabel,
        damageIncrease,
        percentIncrease: (damageIncrease / baselineExpected) * 100,
      };
    })
    .filter((impact) => impact.damageIncrease > 0)
    .sort((left, right) => right.damageIncrease - left.damageIncrease);
}
