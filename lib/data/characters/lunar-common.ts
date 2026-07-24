import type {
  DamageModel,
  LunarReactionType,
} from "../../damage-types.ts";

const talentLevelRatios = [
  1, 1.075, 1.15, 1.25, 1.325, 1.4, 1.5, 1.6, 1.7, 1.8,
  1.9, 2, 2.125,
] as const;

export function talentCurve(levelOneValue: number) {
  return talentLevelRatios.map(
    (ratio) => levelOneValue * ratio,
  );
}

export function talentValueAt(
  levelOneValue: number,
  talentLevel: number,
) {
  const level = Number.isFinite(talentLevel)
    ? Math.round(talentLevel)
    : 1;
  const index = Math.min(
    talentLevelRatios.length - 1,
    Math.max(0, level - 1),
  );
  return levelOneValue * (talentLevelRatios[index] ?? 1);
}

export function directLunarModel(
  reaction: LunarReactionType,
): DamageModel {
  return {
    kind: "directLunar",
    reaction,
    directMultiplier: reaction === "lunarCrystallize" ? 1.6 : 3,
  };
}

export function lunarBaseBonusFromAtk(atk: number) {
  return Math.min(14, (Math.max(0, atk) / 100) * 0.7);
}

export function lunarBaseBonusFromDef(def: number) {
  return Math.min(14, (Math.max(0, def) / 100) * 0.7);
}

export function lunarBaseBonusFromEm(elementalMastery: number) {
  return Math.min(14, Math.max(0, elementalMastery) * 0.0175);
}
