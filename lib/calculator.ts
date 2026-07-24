import type { ArtifactModifier } from "./data/artifacts/types.ts";
import type { DamageSettings } from "./damage-types.ts";
import {
  evaluatePanelEffects,
  getRefinementIndex,
  type PanelEffect,
  type PanelModifier,
} from "./effects.ts";

export type ElementKey =
  | "cryo"
  | "hydro"
  | "pyro"
  | "electro"
  | "anemo"
  | "geo"
  | "dendro";

export type WeaponType =
  | "sword"
  | "claymore"
  | "polearm"
  | "bow"
  | "catalyst"
  | "any";

export type SecondaryStatKey =
  | "none"
  | "atkPct"
  | "hpPct"
  | "defPct"
  | "critRate"
  | "critDmg"
  | "energyRecharge"
  | "elementalMastery";

export interface CharacterBase {
  name: string;
  level: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  ascensionStat: SecondaryStatKey;
  ascensionValue: number;
}

export interface WeaponBase {
  id?: string;
  name: string;
  weaponType?: WeaponType;
  level: number;
  refinement: number;
  baseAtk: number;
  secondaryStat: SecondaryStatKey;
  secondaryValue: number;
}

export interface ArtifactStats {
  flatHp: number;
  flatAtk: number;
  flatDef: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalMastery: number;
  elementalDmg: number;
  healingBonus: number;
}

export interface TalentBonuses {
  skill: number;
  burst: number;
  normal: number;
  charged: number;
  plunge: number;
}

export interface BuildInput {
  element: ElementKey;
  character: CharacterBase;
  weapon: WeaponBase;
  weaponPassiveSelections?: Record<string, string>;
  artifactSetId?: string;
  artifactSetPieces?: 0 | 2 | 4;
  artifactSetSelections?: Record<string, string>;
  artifact: ArtifactStats;
  talentBonuses: TalentBonuses;
}

export interface FinalPanel {
  hp: number;
  atk: number;
  def: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalMastery: number;
  elementalDmg: number;
  healingBonus: number;
  talentBonuses: TalentBonuses;
}

type AccumulatedStats = {
  hpPct: number;
  atkPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalMastery: number;
  elementalDmg: number;
  healingBonus: number;
};

export interface PanelCalculationOptions {
  artifactModifiers?: readonly ArtifactModifier[];
  panelEffects?: readonly PanelEffect[];
  damageSettings?: DamageSettings;
  includeConditionalEffects?: boolean;
}

function finite(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function addSecondary(
  target: AccumulatedStats,
  stat: SecondaryStatKey,
  value: number,
) {
  if (stat === "none") return;
  target[stat] += finite(value);
}

function oneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

const defaultPanelDamageSettings: DamageSettings = {
  enemyLevel: 105,
  enemyResistance: 10,
  normalTalentLevel: 10,
  skillTalentLevel: 10,
  burstTalentLevel: 10,
  selections: {},
};

function createPanel(
  totals: AccumulatedStats,
  talentBonuses: TalentBonuses,
  baseHp: number,
  baseAtk: number,
  baseDef: number,
  flatStats: { hp: number; atk: number; def: number },
): FinalPanel {
  return {
    hp: Math.round(
      baseHp * (1 + totals.hpPct / 100) + flatStats.hp,
    ),
    atk: Math.round(
      baseAtk * (1 + totals.atkPct / 100) + flatStats.atk,
    ),
    def: Math.round(
      baseDef * (1 + totals.defPct / 100) + flatStats.def,
    ),
    critRate: oneDecimal(totals.critRate),
    critDmg: oneDecimal(totals.critDmg),
    energyRecharge: oneDecimal(totals.energyRecharge),
    elementalMastery: Math.round(totals.elementalMastery),
    elementalDmg: oneDecimal(totals.elementalDmg),
    healingBonus: oneDecimal(totals.healingBonus),
    talentBonuses: {
      skill: oneDecimal(talentBonuses.skill),
      burst: oneDecimal(talentBonuses.burst),
      normal: oneDecimal(talentBonuses.normal),
      charged: oneDecimal(talentBonuses.charged),
      plunge: oneDecimal(talentBonuses.plunge),
    },
  };
}

function applyPanelModifier(
  modifier: PanelModifier,
  totals: AccumulatedStats,
  talentBonuses: TalentBonuses,
  flatStats: { hp: number; atk: number; def: number },
) {
  const value = modifier.value;
  if (
    modifier.stat === "skill" ||
    modifier.stat === "burst" ||
    modifier.stat === "normal" ||
    modifier.stat === "charged" ||
    modifier.stat === "plunge"
  ) {
    talentBonuses[modifier.stat] += value;
    return;
  }
  if (modifier.stat === "flatHp") {
    flatStats.hp += value;
    return;
  }
  if (modifier.stat === "flatAtk") {
    flatStats.atk += value;
    return;
  }
  if (modifier.stat === "flatDef") {
    flatStats.def += value;
    return;
  }
  totals[modifier.stat] += value;
}

/**
 * 统一汇总基础属性、已解析的目录效果与圣遗物套装效果：
 * - 基础属性、角色突破属性、武器基础攻击/副属性、圣遗物合计值。
 * - 目录文件声明效果，计算器只控制 additive → conversion 的阶段顺序。
 * - 仅作用于最终伤害的套装增伤不会写入角色面板。
 * - 不包含敌人抗性、反应倍率或队伍效果。
 */
export function calculateFinalPanel(
  input: BuildInput,
  options: PanelCalculationOptions = {},
): FinalPanel {
  const artifactModifiers = options.artifactModifiers ?? [];
  const effects = options.panelEffects ?? [];
  const damageSettings =
    options.damageSettings ?? defaultPanelDamageSettings;
  const includeConditional =
    options.includeConditionalEffects ?? true;
  const talentBonuses: TalentBonuses = {
    skill: finite(input.talentBonuses.skill),
    burst: finite(input.talentBonuses.burst),
    normal: finite(input.talentBonuses.normal),
    charged: finite(input.talentBonuses.charged),
    plunge: finite(input.talentBonuses.plunge),
  };
  const totals: AccumulatedStats = {
    hpPct: 0,
    atkPct: 0,
    defPct: 0,
    critRate: 5 + finite(input.artifact.critRate),
    critDmg: 50 + finite(input.artifact.critDmg),
    energyRecharge: 100 + finite(input.artifact.energyRecharge),
    elementalMastery: finite(input.artifact.elementalMastery),
    elementalDmg: finite(input.artifact.elementalDmg),
    healingBonus: finite(input.artifact.healingBonus),
  };

  addSecondary(
    totals,
    input.character.ascensionStat,
    input.character.ascensionValue,
  );
  addSecondary(
    totals,
    input.weapon.secondaryStat,
    input.weapon.secondaryValue,
  );

  const deferredArtifactModifiers: ArtifactModifier[] = [];
  for (const modifier of artifactModifiers) {
    if (
      modifier.kind === "damageBonus" ||
      modifier.kind === "reactionBonus" ||
      modifier.kind === "enemyResistanceReduction"
    ) {
      continue;
    }
    if (modifier.kind === "burstFromEnergyRecharge") {
      deferredArtifactModifiers.push(modifier);
      continue;
    }
    if (modifier.element && modifier.element !== input.element) continue;
    if (
      modifier.stat === "skill" ||
      modifier.stat === "burst" ||
      modifier.stat === "normal" ||
      modifier.stat === "charged" ||
      modifier.stat === "plunge"
    ) {
      talentBonuses[modifier.stat] += finite(modifier.value);
      continue;
    }
    totals[modifier.stat] += finite(modifier.value);
  }

  const baseHp = finite(input.character.baseHp);
  const baseAtk =
    finite(input.character.baseAtk) + finite(input.weapon.baseAtk);
  const baseDef = finite(input.character.baseDef);
  const flatStats = {
    hp: finite(input.artifact.flatHp),
    atk: finite(input.artifact.flatAtk),
    def: finite(input.artifact.flatDef),
  };
  const effectContext = (panel: FinalPanel) => ({
    build: input,
    baseHp,
    baseAtk,
    baseDef,
    panel,
    refinementIndex: getRefinementIndex(input.weapon.refinement),
    weaponSelections: input.weaponPassiveSelections ?? {},
    damageSelections: damageSettings.selections,
    damageSettings,
  });

  let panel = createPanel(
    totals,
    talentBonuses,
    baseHp,
    baseAtk,
    baseDef,
    flatStats,
  );
  for (const modifier of evaluatePanelEffects(
    effects,
    "additive",
    includeConditional,
    effectContext(panel),
  )) {
    applyPanelModifier(modifier, totals, talentBonuses, flatStats);
  }

  panel = createPanel(
    totals,
    talentBonuses,
    baseHp,
    baseAtk,
    baseDef,
    flatStats,
  );
  for (const modifier of evaluatePanelEffects(
    effects,
    "conversion",
    includeConditional,
    effectContext(panel),
  )) {
    applyPanelModifier(modifier, totals, talentBonuses, flatStats);
  }

  for (const modifier of deferredArtifactModifiers) {
    if (modifier.kind === "burstFromEnergyRecharge") {
      talentBonuses.burst += Math.min(
        finite(modifier.max),
        totals.energyRecharge * finite(modifier.ratio),
      );
    }
  }

  return createPanel(
    totals,
    talentBonuses,
    baseHp,
    baseAtk,
    baseDef,
    flatStats,
  );
}
