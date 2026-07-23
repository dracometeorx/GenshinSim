import {
  getArtifactModifiers,
  type ArtifactModifier,
} from "./data/artifacts/index.ts";

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

function refinementIndex(input: BuildInput) {
  return Math.min(
    4,
    Math.max(0, Math.round(finite(input.weapon.refinement)) - 1),
  );
}

/**
 * 计算基础面板、当前武器自身的被动与圣遗物套装效果：
 * - 基础属性、角色突破属性、武器基础攻击/副属性、圣遗物合计值。
 * - 套装中的角色面板属性与分类伤害加成会参与结果计算。
 * - 仅作用于最终伤害的套装增伤不会写入角色面板。
 * - 不包含敌人抗性、反应倍率、角色技能动态增益或队伍效果。
 */
export function calculateFinalPanel(input: BuildInput): FinalPanel {
  const passive = input.weaponPassiveSelections ?? {};
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
  for (const modifier of getArtifactModifiers(
    input.artifactSetId,
    input.artifactSetPieces,
    input.artifactSetSelections,
  )) {
    if (
      modifier.kind === "damageBonus" ||
      modifier.kind === "reactionBonus"
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
  let flatAtkFromWeapon = 0;
  const refinement = refinementIndex(input);

  switch (input.weapon.id) {
    case "mistsplitter": {
      const stacks = Math.min(
        3,
        Math.max(0, Number(passive.mistsplitterStacks) || 0),
      );
      const baseBonus = [12, 15, 18, 21, 24][refinement];
      const stackBonus = [
        [0, 8, 16, 28],
        [0, 10, 20, 35],
        [0, 12, 24, 42],
        [0, 14, 28, 49],
        [0, 16, 32, 56],
      ][refinement][stacks];
      totals.elementalDmg += baseBonus + stackBonus;
      break;
    }
    case "homa": {
      const hpBonus = [20, 25, 30, 35, 40][refinement];
      const atkRatio = [0.8, 1, 1.2, 1.4, 1.6][refinement];
      const lowHpRatio = [1, 1.2, 1.4, 1.6, 1.8][refinement];
      totals.hpPct += hpBonus;
      const passiveHp =
        baseHp * (1 + totals.hpPct / 100) + finite(input.artifact.flatHp);
      const activeRatio =
        atkRatio +
        (passive.homaHpState === "below50" ? lowHpRatio : 0);
      flatAtkFromWeapon += passiveHp * (activeRatio / 100);
      break;
    }
    case "engulfing": {
      if (passive.engulfingBurst === "active") {
        totals.energyRecharge += [30, 35, 40, 45, 50][refinement];
      }
      totals.atkPct += Math.min(
        [80, 90, 100, 110, 120][refinement],
        Math.max(0, totals.energyRecharge - 100) *
          [0.28, 0.35, 0.42, 0.49, 0.56][refinement],
      );
      break;
    }
  }

  for (const modifier of deferredArtifactModifiers) {
    if (modifier.kind === "burstFromEnergyRecharge") {
      talentBonuses.burst += Math.min(
        finite(modifier.max),
        totals.energyRecharge * finite(modifier.ratio),
      );
    }
  }

  return {
    hp: Math.round(
      baseHp * (1 + totals.hpPct / 100) + finite(input.artifact.flatHp),
    ),
    atk: Math.round(
      baseAtk * (1 + totals.atkPct / 100) +
        finite(input.artifact.flatAtk) +
        flatAtkFromWeapon,
    ),
    def: Math.round(
      baseDef * (1 + totals.defPct / 100) + finite(input.artifact.flatDef),
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
