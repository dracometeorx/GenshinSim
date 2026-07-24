"use client";

import type { Dispatch, SetStateAction } from "react";
import type { BuildInput } from "../../lib/calculator";
import {
  artifactSets,
  type ArtifactSetPreset,
} from "../../lib/data/artifacts";
import { NumberField } from "./number-field";
import { NumericInput } from "./numeric-input";

const artifactFields: Array<{
  key: keyof BuildInput["artifact"];
  label: string;
  unit: string;
  icon: string;
}> = [
  { key: "flatHp", label: "生命值", unit: "", icon: "♡" },
  { key: "flatAtk", label: "攻击力", unit: "", icon: "†" },
  { key: "flatDef", label: "防御力", unit: "", icon: "⬡" },
  { key: "critRate", label: "暴击率", unit: "%", icon: "✥" },
  { key: "critDmg", label: "暴击伤害", unit: "%", icon: "✷" },
  { key: "energyRecharge", label: "元素充能", unit: "%", icon: "◌" },
  { key: "elementalMastery", label: "元素精通", unit: "", icon: "✦" },
  { key: "elementalDmg", label: "元素伤害", unit: "%", icon: "❄" },
  { key: "healingBonus", label: "治疗加成", unit: "%", icon: "✚" },
];

const talentTabs: Array<{
  key: keyof BuildInput["talentBonuses"];
  label: string;
  icon: string;
}> = [
  { key: "skill", label: "元素战技", icon: "❄" },
  { key: "burst", label: "元素爆发", icon: "✷" },
  { key: "normal", label: "普攻", icon: "⚔" },
  { key: "charged", label: "重击", icon: "➤" },
  { key: "plunge", label: "下落攻击", icon: "↓" },
];

export function ArtifactInput({
  activeElementIcon,
  activeTalent,
  build,
  open,
  selectedArtifactSet,
  onArtifactChange,
  onArtifactEffectChange,
  onArtifactSetChange,
  onArtifactSetPiecesChange,
  onOpenChange,
  onTalentChange,
  setBuild,
}: {
  activeElementIcon: string;
  activeTalent: keyof BuildInput["talentBonuses"];
  build: BuildInput;
  open: boolean;
  selectedArtifactSet: ArtifactSetPreset;
  onArtifactChange: (
    key: keyof BuildInput["artifact"],
    value: number,
  ) => void;
  onArtifactEffectChange: (key: string, value: string) => void;
  onArtifactSetChange: (id: string) => void;
  onArtifactSetPiecesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onTalentChange: (talent: keyof BuildInput["talentBonuses"]) => void;
  setBuild: Dispatch<SetStateAction<BuildInput>>;
}) {
  const activeTalentLabel = talentTabs.find(
    (talent) => talent.key === activeTalent,
  )?.label;

  return (
    <>
      <article className="panel input-panel">
        <button
          className="panel-heading"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
        >
          <span>
            <strong>圣遗物面板</strong>
            <small>选择套装并填写详情页合计值</small>
          </span>
          <span className={open ? "chevron open" : "chevron"}>⌄</span>
        </button>
        {open ? (
          <div className="artifact-content">
            <div className="artifact-set-picker">
              <div className="artifact-set-controls">
                <label className="artifact-set-field">
                  <span>套装选择</span>
                  <select
                    aria-label="选择圣遗物套装"
                    value={build.artifactSetId ?? "none"}
                    onChange={(event) =>
                      onArtifactSetChange(event.target.value)
                    }
                  >
                    {artifactSets.map((artifactSet) => (
                      <option key={artifactSet.id} value={artifactSet.id}>
                        {artifactSet.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="artifact-set-field pieces-field">
                  <span>套装件数</span>
                  <select
                    aria-label="选择圣遗物套装件数"
                    disabled={selectedArtifactSet.id === "none"}
                    value={build.artifactSetPieces ?? 0}
                    onChange={(event) =>
                      onArtifactSetPiecesChange(event.target.value)
                    }
                  >
                    <option value="0">不启用</option>
                    <option value="2">2 件套</option>
                    <option value="4">4 件套</option>
                  </select>
                </label>
              </div>

              {build.artifactSetPieces ? (
                <div className="artifact-set-effect">
                  <div className="artifact-set-copy">
                    <strong>
                      {selectedArtifactSet.shortName} ·{" "}
                      {build.artifactSetPieces} 件套
                    </strong>
                    <small>
                      {selectedArtifactSet.twoPiece.description}
                      {build.artifactSetPieces === 4
                        ? ` ${selectedArtifactSet.fourPiece.description}`
                        : ""}
                    </small>
                    {build.artifactSetPieces === 4 &&
                    selectedArtifactSet.fourPiece.panelNote ? (
                      <em>
                        {selectedArtifactSet.fourPiece.panelNote}
                      </em>
                    ) : null}
                  </div>
                  {build.artifactSetPieces === 4 &&
                  selectedArtifactSet.fourPiece.control ? (
                    <label className="passive-select artifact-condition">
                      <span>
                        {selectedArtifactSet.fourPiece.control.label}
                      </span>
                      <select
                        aria-label={
                          selectedArtifactSet.fourPiece.control.label
                        }
                        value={
                          build.artifactSetSelections?.[
                            selectedArtifactSet.fourPiece.control.key
                          ] ??
                          selectedArtifactSet.fourPiece.control
                            .defaultValue
                        }
                        onChange={(event) =>
                          onArtifactEffectChange(
                            selectedArtifactSet.fourPiece.control!.key,
                            event.target.value,
                          )
                        }
                      >
                        {selectedArtifactSet.fourPiece.control.options.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ) : (
                    <span className="passive-badge">
                      {build.artifactSetPieces === 4
                        ? "效果自动计算"
                        : "2 件套已启用"}
                    </span>
                  )}
                </div>
              ) : (
                <div className="artifact-set-empty">
                  选择套装与件数后，效果会按类型加入最终面板或技能伤害。
                </div>
              )}
            </div>

            <div className="artifact-grid">
              {artifactFields.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  unit={field.unit}
                  icon={
                    field.key === "elementalDmg"
                      ? activeElementIcon
                      : field.icon
                  }
                  value={build.artifact[field.key]}
                  onChange={(value) =>
                    onArtifactChange(field.key, value)
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <article className="panel bonus-panel">
        <div className="panel-title-row">
          <div>
            <strong>额外伤害加成</strong>
            <small>直接参与对应分类的技能伤害</small>
          </div>
          <span className="future-badge">分类增伤</span>
        </div>
        <div className="talent-tabs" role="tablist" aria-label="攻击类型">
          {talentTabs.map((tab) => (
            <button
              role="tab"
              aria-selected={activeTalent === tab.key}
              className={activeTalent === tab.key ? "active" : ""}
              key={tab.key}
              onClick={() => onTalentChange(tab.key)}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {build.talentBonuses[tab.key] > 0 ? (
                <b>{build.talentBonuses[tab.key]}%</b>
              ) : null}
            </button>
          ))}
        </div>
        <div className="bonus-entry">
          <span>{activeTalentLabel} 伤害加成</span>
          <div className="inline-number">
            <NumericInput
              aria-label="额外伤害加成"
              value={build.talentBonuses[activeTalent]}
              min={0}
              max={10_000}
              onCommit={(value) =>
                setBuild((current) => ({
                  ...current,
                  talentBonuses: {
                    ...current.talentBonuses,
                    [activeTalent]: value,
                  },
                }))
              }
            />
            <span>%</span>
          </div>
        </div>
      </article>
    </>
  );
}
