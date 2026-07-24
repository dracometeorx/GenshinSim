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
import type { CharacterPreset } from "./data/characters/types.ts";

export type CalculationWarningCode =
  | "INCOMPATIBLE_BLIZZARD_MELT_CONDITION"
  | "CHARACTER_BUILD_NORMALIZED";

export interface CalculationWarning {
  code: CalculationWarningCode;
  message: string;
}

export interface CalculationRequest {
  build: BuildInput;
  character: CharacterPreset;
  settings: DamageSettings;
}

export interface CalculationResult extends DamageCalculationResult {
  panel: FinalPanel;
  warnings: CalculationWarning[];
}

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
  settings,
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
  const normalizedBuild: BuildInput = {
    ...build,
    character,
    element:
      character.id === "custom" ? build.element : character.element,
  };

  if (characterMismatch || elementMismatch) {
    warnings.push({
      code: "CHARACTER_BUILD_NORMALIZED",
      message: "角色目录与方案基础属性不一致，已使用当前角色目录数据计算。",
    });
  }

  const panel = calculateFinalPanel(normalizedBuild);
  const damage = calculateRepresentativeDamage(
    character,
    normalizedBuild,
    panel,
    settings,
  );

  const hasMeltVariant = damage.skills.some((skill) =>
    skill.variants.some((variant) => variant.reaction === "melt"),
  );
  const blizzardState =
    normalizedBuild.artifactSetSelections?.blizzardEnemyState;
  if (
    normalizedBuild.artifactSetId === "blizzard-strayer" &&
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

  return {
    ...damage,
    panel,
    warnings,
  };
}
