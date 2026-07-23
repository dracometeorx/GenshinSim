export type ElementKey =
  | "cryo"
  | "hydro"
  | "pyro"
  | "electro"
  | "anemo"
  | "geo"
  | "dendro";

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
  name: string;
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
}

type AccumulatedStats = {
  hpPct: number;
  atkPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalMastery: number;
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

/**
 * 第一版只计算静态面板：
 * - 基础属性、角色突破属性、武器基础攻击/副属性、圣遗物合计值。
 * - 不包含武器被动、套装效果、技能动态增益、敌人或队伍效果。
 * - 天赋分类伤害加成被保留在 BuildInput 中，供后续伤害公式使用。
 */
export function calculateFinalPanel(input: BuildInput): FinalPanel {
  const totals: AccumulatedStats = {
    hpPct: 0,
    atkPct: 0,
    defPct: 0,
    critRate: 5 + finite(input.artifact.critRate),
    critDmg: 50 + finite(input.artifact.critDmg),
    energyRecharge: 100 + finite(input.artifact.energyRecharge),
    elementalMastery: finite(input.artifact.elementalMastery),
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

  const baseHp = finite(input.character.baseHp);
  const baseAtk =
    finite(input.character.baseAtk) + finite(input.weapon.baseAtk);
  const baseDef = finite(input.character.baseDef);

  return {
    hp: Math.round(
      baseHp * (1 + totals.hpPct / 100) + finite(input.artifact.flatHp),
    ),
    atk: Math.round(
      baseAtk * (1 + totals.atkPct / 100) + finite(input.artifact.flatAtk),
    ),
    def: Math.round(
      baseDef * (1 + totals.defPct / 100) + finite(input.artifact.flatDef),
    ),
    critRate: oneDecimal(totals.critRate),
    critDmg: oneDecimal(totals.critDmg),
    energyRecharge: oneDecimal(totals.energyRecharge),
    elementalMastery: Math.round(totals.elementalMastery),
    elementalDmg: oneDecimal(finite(input.artifact.elementalDmg)),
    healingBonus: oneDecimal(finite(input.artifact.healingBonus)),
  };
}
