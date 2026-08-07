"use client";

import type { Dispatch, SetStateAction } from "react";
import type { BuildInput } from "../../lib/calculator";
import type { CalculationResult } from "../../lib/calculation";
import type { CharacterPreset } from "../../lib/data/characters";
import type { DamageSettings } from "../../lib/damage";
import { NumericInput } from "./numeric-input";

const talentLabels: Array<{
  key: keyof BuildInput["talentBonuses"];
  label: string;
}> = [
  { key: "skill", label: "元素战技" },
  { key: "burst", label: "元素爆发" },
  { key: "normal", label: "普攻" },
  { key: "charged", label: "重击" },
  { key: "plunge", label: "下落攻击" },
];

const talentLevelFields = [
  { key: "normalTalentLevel" as const, label: "普攻等级" },
  { key: "skillTalentLevel" as const, label: "战技等级" },
  { key: "burstTalentLevel" as const, label: "爆发等级" },
];

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const moonsignLabels = {
  none: "无月兆",
  nascent: "月兆·初辉",
  ascendant: "月兆·满辉",
} as const;

const lunarReactionBonusLabels = [
  { key: "lunarCharged" as const, label: "月感电" },
  { key: "lunarBloom" as const, label: "月绽放" },
  { key: "lunarCrystallize" as const, label: "月结晶" },
];

const stellarReactionBonusLabels = [
  { key: "stellarConduct" as const, label: "星电导" },
];

const elementDisplay: Record<string, { label: string; icon: string }> = {
  cryo: { label: "冰", icon: "❄" },
  hydro: { label: "水", icon: "◉" },
  pyro: { label: "火", icon: "◆" },
  electro: { label: "雷", icon: "ϟ" },
  anemo: { label: "风", icon: "✤" },
  geo: { label: "岩", icon: "◇" },
  dendro: { label: "草", icon: "♧" },
};

export function ResultPanel({
  activeElement,
  artifactSetName,
  build,
  calculation,
  copied,
  damageSettings,
  operationNotice,
  selectedCharacter,
  storageError,
  updatedAt,
  onCopy,
  onDamageSelection,
  onShare,
  setDamageSettings,
}: {
  activeElement: { label: string; icon: string };
  artifactSetName: string;
  build: BuildInput;
  calculation: CalculationResult;
  copied: boolean;
  damageSettings: DamageSettings;
  operationNotice: string;
  selectedCharacter?: CharacterPreset;
  storageError: string | null;
  updatedAt: string;
  onCopy: () => void;
  onDamageSelection: (key: string, value: string) => void;
  onShare: () => void;
  setDamageSettings: Dispatch<SetStateAction<DamageSettings>>;
}) {
  const panel = calculation.panel;
  const displayedSkills = calculation.selectedSkill
    ? [calculation.selectedSkill]
    : [];

  return (
    <aside className="panel result-panel" aria-live="polite">
      <div className="result-heading">
        <div>
          <span className={`result-element element-${build.element}`}>
            {activeElement.icon}
          </span>
          <span>
            <strong>最终面板</strong>
            <small>
              {build.character.name} C{calculation.constellation} ·{" "}
              {build.weapon.name} ·{" "}
              {build.artifactSetPieces ? artifactSetName : "无套装"}
            </small>
          </span>
        </div>
        <span className="theory-badge">
          {[
            calculation.moonsign.level === "none"
              ? null
              : moonsignLabels[calculation.moonsign.level],
            calculation.hexerei.secretRite ? "魔导·秘仪" : null,
            calculation.stellarConduct.active
              ? `星极场·${calculation.stellarConduct.elementalPower} 元素力`
              : null,
            "理论值",
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      <dl className="detail-stats">
        <div>
          <dt>
            <span>♡</span>生命值
          </dt>
          <dd>{formatNumber(panel.hp)}</dd>
        </div>
        <div>
          <dt>
            <span>†</span>攻击力
          </dt>
          <dd>{formatNumber(panel.atk)}</dd>
        </div>
        <div>
          <dt>
            <span>⬡</span>防御力
          </dt>
          <dd>{formatNumber(panel.def)}</dd>
        </div>
        <div>
          <dt>
            <span>✥</span>暴击率
          </dt>
          <dd>{formatNumber(panel.critRate, 1)}%</dd>
        </div>
        <div>
          <dt>
            <span>✷</span>暴击伤害
          </dt>
          <dd>{formatNumber(panel.critDmg, 1)}%</dd>
        </div>
        <div>
          <dt>
            <span>◌</span>元素充能效率
          </dt>
          <dd>{formatNumber(panel.energyRecharge, 1)}%</dd>
        </div>
        <div>
          <dt>
            <span>✦</span>元素精通
          </dt>
          <dd>{formatNumber(panel.elementalMastery)}</dd>
        </div>
        <div>
          <dt>
            <span>{activeElement.icon}</span>
            {activeElement.label}伤害加成
          </dt>
          <dd>{formatNumber(panel.elementalDmg, 1)}%</dd>
        </div>
        <div>
          <dt>
            <span>✚</span>治疗加成
          </dt>
          <dd>{formatNumber(panel.healingBonus, 1)}%</dd>
        </div>
      </dl>

      <div className="bonus-summary">
        <div className="bonus-summary-group">
          <span>分类伤害加成</span>
          <div>
            {talentLabels.map((talent) => (
              <b key={talent.key}>
                {talent.label}{" "}
                {formatNumber(
                  calculation.damageBonusSummary.categories[
                    talent.key
                  ],
                  1,
                )}
                %
              </b>
            ))}
          </div>
        </div>
        <div className="bonus-summary-group">
          <span>月反应伤害提升</span>
          <div>
            {lunarReactionBonusLabels.map((reaction) => (
              <b key={reaction.key}>
                {reaction.label}{" "}
                {formatNumber(
                  calculation.damageBonusSummary.lunarReactions[
                    reaction.key
                  ],
                  1,
                )}
                % · 擢升{" "}
                {formatNumber(
                  calculation.damageBonusSummary.lunarElevations[
                    reaction.key
                  ],
                  1,
                )}
                %
              </b>
            ))}
          </div>
        </div>
        <div className="bonus-summary-group">
          <span>星反应伤害提升</span>
          <div>
            {stellarReactionBonusLabels.map((reaction) => (
              <b key={reaction.key}>
                {reaction.label}{" "}
                {formatNumber(
                  calculation.damageBonusSummary.stellarReactions[
                    reaction.key
                  ],
                  1,
                )}
                %
              </b>
            ))}
          </div>
        </div>
      </div>

      <section className="damage-section" aria-label="代表技能伤害">
        <div className="damage-heading">
          <span>
            <strong>代表技能伤害</strong>
            <small>单目标 · 按普通、月曜或星电导直伤模型分别计算</small>
          </span>
          <span className="damage-badge">天赋独立设置</span>
        </div>

        {calculation.warnings.length ? (
          <div className="calculation-warnings" role="status">
            {calculation.warnings.map((warning) => (
              <p key={warning.code}>
                <span>!</span>
                {warning.message}
              </p>
            ))}
          </div>
        ) : null}

        <div className="damage-settings">
          <section className="damage-setting-group character-settings">
            <header>
              <strong>角色状态</strong>
              <small>天赋等级与角色自身条件</small>
            </header>
            <div className="talent-level-settings">
              {talentLevelFields.map((talent) => (
                <label key={talent.key}>
                  <span>{talent.label}</span>
                  <select
                    aria-label={talent.label}
                    value={damageSettings[talent.key]}
                    onChange={(event) =>
                      setDamageSettings((current) => ({
                        ...current,
                        [talent.key]: Number(event.target.value),
                      }))
                    }
                  >
                    {Array.from(
                      { length: 10 },
                      (_, index) => index + 1,
                    ).map((level) => (
                      <option key={level} value={level}>
                        {level} 级
                      </option>
                    ))}
                  </select>
                  {calculation.effectiveSettings[talent.key] !==
                  damageSettings[talent.key] ? (
                    <small>
                      命座后{" "}
                      {calculation.effectiveSettings[talent.key]} 级
                    </small>
                  ) : null}
                </label>
              ))}
            </div>
            {selectedCharacter?.damageProfile?.controls.length ? (
              <div className="character-condition-settings">
                {selectedCharacter.damageProfile.controls.map(
                  (control) => (
                    <label key={control.key}>
                      <span>{control.label}</span>
                      <select
                        aria-label={control.label}
                        value={
                          damageSettings.selections[control.key] ??
                          control.defaultValue
                        }
                        onChange={(event) =>
                          onDamageSelection(
                            control.key,
                            event.target.value,
                          )
                        }
                      >
                        {control.options.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ),
                )}
              </div>
            ) : null}
          </section>

          <section className="damage-setting-group enemy-settings">
            <header>
              <strong>敌人设置</strong>
              <small>独立参与防御与抗性计算</small>
            </header>
            <div className="enemy-setting-fields">
              <label>
                <span>敌人等级</span>
                <NumericInput
                  aria-label="敌人等级"
                  inputMode="numeric"
                  value={damageSettings.enemyLevel}
                  min={1}
                  max={200}
                  onCommit={(value) =>
                    setDamageSettings((current) => ({
                      ...current,
                      enemyLevel: Math.round(value),
                    }))
                  }
                />
              </label>
              <label>
                <span>元素抗性</span>
                <span className="compact-number">
                  <NumericInput
                    aria-label="敌人元素抗性"
                    value={damageSettings.enemyResistance}
                    min={-100}
                    max={1000}
                    onCommit={(value) =>
                      setDamageSettings((current) => ({
                        ...current,
                        enemyResistance: value,
                      }))
                    }
                  />
                  <i>%</i>
                </span>
              </label>
            </div>
          </section>
        </div>

        {displayedSkills.length ? (
          <div className="damage-skills">
            {displayedSkills.map((skill) => (
              <article className="damage-skill" key={skill.id}>
                <div className="damage-skill-title">
                  <span>
                    <strong>{skill.name}</strong>
                    {skill.damageElement !== build.element ? (
                      <small className="damage-element-badge">
                        {elementDisplay[skill.damageElement]?.icon ??
                          skill.damageElement}
                        {
                          elementDisplay[skill.damageElement]
                            ?.label
                        }
                        伤害结算
                      </small>
                    ) : null}
                    <small>{skill.description}</small>
                  </span>
                  <b>
                    {skill.multiplierLabel}
                    {skill.model === "directLunar"
                      ? " · 月曜直伤"
                      : skill.model === "directStellar"
                        ? " · 星电导直伤"
                      : ""}
                  </b>
                </div>
                <div className="damage-table" role="table">
                  <div className="damage-table-head" role="row">
                    <span role="columnheader">反应</span>
                    <span role="columnheader">未暴击</span>
                    <span role="columnheader">暴击</span>
                    <span role="columnheader">期望</span>
                  </div>
                  {skill.variants.map((variant) => (
                    <div
                      className={`damage-row reaction-${variant.reaction}`}
                      key={variant.reaction}
                      role="row"
                    >
                      <span role="cell">{variant.label}</span>
                      <span role="cell">
                        {formatNumber(variant.nonCrit)}
                      </span>
                      <strong role="cell">
                        {formatNumber(variant.crit)}
                      </strong>
                      <strong className="damage-expected" role="cell">
                        {formatNumber(variant.expected)}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="damage-empty">
            自定义角色暂无代表技能数据；最终面板仍可正常计算。
          </div>
        )}

        <p className="damage-formula-note">
          {displayedSkills.some(
            (skill) => skill.model === "directLunar",
          )
            ? `${moonsignLabels[calculation.moonsign.level]}（${calculation.moonsign.count} 级） · 月曜直伤不进入常规防御区与元素/分类增伤区，各结果按其伤害元素单独结算抗性`
            : displayedSkills.some(
                  (skill) => skill.model === "directStellar",
                )
              ? `星极场 ${calculation.stellarConduct.elementalPower} 元素力 · 星电导直伤不进入常规防御区与元素/分类增伤区，按伤害元素单独结算抗性`
            : `防御倍率 ${(calculation.defenseMultiplier * 100).toFixed(1)}% · 有效抗性 ${calculation.effectiveResistance.toFixed(1)}% · 抗性倍率 ${(calculation.resistanceMultiplier * 100).toFixed(1)}%`}
          {displayedSkills.length > 1 &&
          new Set(
            displayedSkills.map((s) => s.damageElement),
          ).size > 1
            ? `（${displayedSkills
                .map((s) => s.damageElement)
                .filter(
                  (el, i, arr) => arr.indexOf(el) === i,
                )
                .join("、")} 伤害分别结算抗性）`
            : ""}
        </p>
      </section>

      <div className="result-note">
        <span>ⓘ</span>
        <p>
          技能伤害为理论单目标值；
          <br />
          已计入命座及已开启的角色、武器、圣遗物与元素共鸣增益
          {calculation.teamBuffs.length
            ? `（${calculation.teamBuffs.filter((buff) => buff.enabled).length}/${calculation.teamBuffs.length} 项开启）`
            : ""}
          ；不模拟产球、循环、冷却与多目标。
        </p>
      </div>

      <div className="result-actions">
        <button onClick={onShare}>
          <span>⌯</span>分享结果
        </button>
        <button onClick={onCopy}>
          <span>{copied ? "✓" : "▣"}</span>
          {copied ? "已复制" : "复制数据"}
        </button>
      </div>
      {storageError || operationNotice ? (
        <p className="operation-notice" role="status">
          {operationNotice || storageError}
        </p>
      ) : null}
      <p className="updated-at">更新时间：{updatedAt}</p>
    </aside>
  );
}
