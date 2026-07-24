import type { BuildInput } from "./calculator.ts";
import type { CalculationResult } from "./calculation.ts";
import type { DamageSettings } from "./damage.ts";

export function createResultPayload({
  artifactSetName,
  build,
  elementLabel,
  result,
  settings,
}: {
  artifactSetName: string;
  build: BuildInput;
  elementLabel: string;
  result: CalculationResult;
  settings: DamageSettings;
}) {
  const panel = result.panel;
  return {
    角色: `${build.character.name} Lv.${build.character.level}`,
    命之座: `C${result.constellation}`,
    月兆:
      result.moonsign.level === "ascendant"
        ? `满辉（${result.moonsign.count} 级）`
        : result.moonsign.level === "nascent"
          ? `初辉（${result.moonsign.count} 级）`
          : "无",
    魔导:
      result.hexerei.count > 0
        ? `${result.hexerei.count} 名${
            result.hexerei.secretRite ? "（魔导·秘仪）" : ""
          }`
        : "无",
    星电导: result.stellarConduct.active
      ? `星极场已建立（${result.stellarConduct.elementalPower} 元素力）`
      : "未建立星极场",
    武器: `${build.weapon.name} Lv.${build.weapon.level}`,
    圣遗物套装:
      build.artifactSetPieces && build.artifactSetPieces > 0
        ? `${artifactSetName} ${build.artifactSetPieces} 件套`
        : "无套装效果",
    生命值: panel.hp,
    攻击力: panel.atk,
    防御力: panel.def,
    暴击率: `${panel.critRate}%`,
    暴击伤害: `${panel.critDmg}%`,
    元素充能效率: `${panel.energyRecharge}%`,
    元素精通: panel.elementalMastery,
    [`${elementLabel}伤害加成`]: `${panel.elementalDmg}%`,
    额外伤害加成: panel.talentBonuses,
    队伍增益: result.teamBuffs
      .filter((buff) => buff.enabled)
      .map(
        (buff) =>
          `${buff.sourceName} · ${buff.name}：${buff.description}`,
      ),
    敌人: {
      等级: settings.enemyLevel,
      元素抗性: `${settings.enemyResistance}%`,
    },
    代表技能伤害: Object.fromEntries(
      result.skills.map((skill) => [
        skill.name,
        Object.fromEntries(
          skill.variants.map((variant) => [
            variant.label,
            {
              模型:
                variant.model === "directLunar"
                  ? "月曜直伤"
                  : variant.model === "directStellar"
                    ? "星电导直伤"
                  : "普通直伤",
              未暴击: variant.nonCrit,
              暴击: variant.crit,
              期望: variant.expected,
              防御倍率: variant.defenseMultiplier,
              抗性倍率: variant.resistanceMultiplier,
            },
          ]),
        ),
      ]),
    ),
  };
}

export function createShareText(
  build: BuildInput,
  result: CalculationResult,
) {
  const panel = result.panel;
  return `${build.character.name} C${result.constellation}｜生命 ${panel.hp.toLocaleString("zh-CN")}｜攻击 ${panel.atk.toLocaleString("zh-CN")}｜双暴 ${panel.critRate}% / ${panel.critDmg}%｜队伍增益 ${result.teamBuffs.filter((buff) => buff.enabled).length} 项`;
}
