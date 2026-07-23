"use client";

import { useEffect, useMemo, useState } from "react";
import {
  artifactSets,
  getArtifactSet,
} from "../lib/data/artifacts";
import { characters } from "../lib/data/characters";
import { weapons } from "../lib/data/weapons";
import {
  BuildInput,
  ElementKey,
  FinalPanel,
  SecondaryStatKey,
  calculateFinalPanel,
} from "../lib/calculator";

const elements: Array<{ key: ElementKey; label: string; icon: string }> = [
  { key: "cryo", label: "冰元素", icon: "❄" },
  { key: "hydro", label: "水元素", icon: "◉" },
  { key: "pyro", label: "火元素", icon: "◆" },
  { key: "electro", label: "雷元素", icon: "ϟ" },
  { key: "anemo", label: "风元素", icon: "✤" },
  { key: "geo", label: "岩元素", icon: "◇" },
  { key: "dendro", label: "草元素", icon: "♧" },
];

const defaultBuild: BuildInput = {
  element: "cryo",
  character: characters[0],
  weapon: weapons[0],
  weaponPassiveSelections: {
    mistsplitterStacks: "0",
  },
  artifactSetId: "blizzard-strayer",
  artifactSetPieces: 4,
  artifactSetSelections: {
    blizzardEnemyState: "frozen",
  },
  artifact: {
    flatHp: 9615,
    flatAtk: 1110,
    flatDef: 62,
    critRate: 37.7,
    critDmg: 96.1,
    energyRecharge: 18.1,
    elementalMastery: 0,
    elementalDmg: 61.6,
    healingBonus: 0,
  },
  talentBonuses: {
    skill: 0,
    burst: 0,
    normal: 0,
    charged: 0,
    plunge: 0,
  },
};

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

const secondaryOptions: Array<{ value: SecondaryStatKey; label: string }> = [
  { value: "none", label: "无" },
  { value: "atkPct", label: "攻击力 %" },
  { value: "hpPct", label: "生命值 %" },
  { value: "defPct", label: "防御力 %" },
  { value: "critRate", label: "暴击率 %" },
  { value: "critDmg", label: "暴击伤害 %" },
  { value: "energyRecharge", label: "元素充能效率 %" },
  { value: "elementalMastery", label: "元素精通" },
];

function NumberField({
  label,
  value,
  unit,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  icon?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="stat-field">
      <span className="stat-label">
        {icon ? <span className="stat-icon">{icon}</span> : null}
        {label}
        {unit ? <span className="field-kind">{unit}</span> : null}
      </span>
      <span className="number-wrap">
        <input
          inputMode="decimal"
          min="0"
          step="0.1"
          type="number"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
    </label>
  );
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const storageKey = "genshin-panel-build-v3";
const previousStorageKey = "genshin-panel-build-v2";
const legacyStorageKey = "genshin-panel-build-v1";

type LegacyBuildInput = Omit<BuildInput, "artifact"> & {
  artifact: BuildInput["artifact"] & {
    hpPct?: number;
    atkPct?: number;
    defPct?: number;
  };
};

function migrateLegacyBuild(legacy: LegacyBuildInput): BuildInput {
  const hpPct = Math.max(0, Number(legacy.artifact.hpPct) || 0);
  const atkPct = Math.max(0, Number(legacy.artifact.atkPct) || 0);
  const defPct = Math.max(0, Number(legacy.artifact.defPct) || 0);
  const baseAtk =
    Math.max(0, legacy.character.baseAtk) +
    Math.max(0, legacy.weapon.baseAtk);

  return {
    ...legacy,
    artifact: {
      flatHp: Math.round(
        Math.max(0, legacy.artifact.flatHp) +
          Math.max(0, legacy.character.baseHp) * (hpPct / 100),
      ),
      flatAtk: Math.round(
        Math.max(0, legacy.artifact.flatAtk) + baseAtk * (atkPct / 100),
      ),
      flatDef: Math.round(
        Math.max(0, legacy.artifact.flatDef) +
          Math.max(0, legacy.character.baseDef) * (defPct / 100),
      ),
      critRate: legacy.artifact.critRate,
      critDmg: legacy.artifact.critDmg,
      energyRecharge: legacy.artifact.energyRecharge,
      elementalMastery: legacy.artifact.elementalMastery,
      elementalDmg: legacy.artifact.elementalDmg,
      healingBonus: legacy.artifact.healingBonus,
    },
  };
}

export default function Home() {
  const [build, setBuild] = useState<BuildInput>(defaultBuild);
  const [panel, setPanel] = useState<FinalPanel>(() =>
    calculateFinalPanel(defaultBuild),
  );
  const [characterId, setCharacterId] = useState("ayaka");
  const [weaponId, setWeaponId] = useState("mistsplitter");
  const [activeTalent, setActiveTalent] =
    useState<keyof BuildInput["talentBonuses"]>("skill");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("示例数据");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      const previousSaved = saved
        ? null
        : window.localStorage.getItem(previousStorageKey);
      const legacySaved = saved || previousSaved
        ? null
        : window.localStorage.getItem(legacyStorageKey);
      const persisted = saved ?? previousSaved ?? legacySaved;
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as {
            build: BuildInput | LegacyBuildInput;
            characterId: string;
            weaponId: string;
          };
          const restoredBuild = legacySaved
            ? migrateLegacyBuild(parsed.build as LegacyBuildInput)
            : (parsed.build as BuildInput);
          const normalizedBuild: BuildInput = {
            ...restoredBuild,
            artifactSetId: restoredBuild.artifactSetId ?? "none",
            artifactSetPieces: restoredBuild.artifactSetPieces ?? 0,
            artifactSetSelections:
              restoredBuild.artifactSetSelections ?? {},
          };
          setBuild(normalizedBuild);
          setPanel(calculateFinalPanel(normalizedBuild));
          setCharacterId(parsed.characterId);
          setWeaponId(parsed.weaponId);
          setUpdatedAt(saved ? "已恢复" : "已迁移旧版数据");
          if (!saved) {
            window.localStorage.removeItem(previousStorageKey);
            window.localStorage.removeItem(legacyStorageKey);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
          window.localStorage.removeItem(previousStorageKey);
          window.localStorage.removeItem(legacyStorageKey);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ build, characterId, weaponId }),
    );
  }, [build, characterId, weaponId, hydrated]);

  const activeElement = useMemo(
    () => elements.find((element) => element.key === build.element) ?? elements[0],
    [build.element],
  );
  const selectedArtifactSet = useMemo(
    () => getArtifactSet(build.artifactSetId),
    [build.artifactSetId],
  );

  function chooseCharacter(id: string) {
    const character = characters.find((item) => item.id === id);
    if (!character) return;
    setCharacterId(id);
    setBuild((current) => ({
      ...current,
      character,
      element: character.element,
    }));
  }

  function chooseWeapon(id: string) {
    const weapon = weapons.find((item) => item.id === id);
    if (!weapon) return;
    setWeaponId(id);
    setBuild((current) => ({
      ...current,
      weapon,
      weaponPassiveSelections: weapon.passive.control
        ? {
            [weapon.passive.control.key]:
              weapon.passive.control.defaultValue,
          }
        : {},
    }));
  }

  function updateWeaponPassive(key: string, value: string) {
    setBuild((current) => ({
      ...current,
      weaponPassiveSelections: {
        ...current.weaponPassiveSelections,
        [key]: value,
      },
    }));
  }

  function chooseArtifactSet(id: string) {
    const artifactSet = getArtifactSet(id);
    const control = artifactSet.fourPiece.control;
    setBuild((current) => ({
      ...current,
      artifactSetId: artifactSet.id,
      artifactSetPieces: artifactSet.id === "none" ? 0 : 4,
      artifactSetSelections: control
        ? { [control.key]: control.defaultValue }
        : {},
    }));
  }

  function updateArtifactSetPieces(value: string) {
    const pieces = Number(value) as 0 | 2 | 4;
    setBuild((current) => ({
      ...current,
      artifactSetPieces: pieces,
    }));
  }

  function updateArtifactSetEffect(key: string, value: string) {
    setBuild((current) => ({
      ...current,
      artifactSetSelections: {
        ...current.artifactSetSelections,
        [key]: value,
      },
    }));
  }

  function updateArtifact(
    key: keyof BuildInput["artifact"],
    value: number,
  ) {
    setBuild((current) => ({
      ...current,
      artifact: { ...current.artifact, [key]: value },
    }));
  }

  function calculate() {
    setPanel(calculateFinalPanel(build));
    setUpdatedAt(
      new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    );
    window.setTimeout(() => {
      document
        .querySelector(".result-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function reset() {
    setBuild(defaultBuild);
    setPanel(calculateFinalPanel(defaultBuild));
    setCharacterId("ayaka");
    setWeaponId("mistsplitter");
    setUpdatedAt("已重置");
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(previousStorageKey);
    window.localStorage.removeItem(legacyStorageKey);
  }

  async function copyResult() {
    const payload = {
      角色: `${build.character.name} Lv.${build.character.level}`,
      武器: `${build.weapon.name} Lv.${build.weapon.level}`,
      圣遗物套装:
        build.artifactSetPieces && build.artifactSetPieces > 0
          ? `${selectedArtifactSet.name} ${build.artifactSetPieces} 件套`
          : "无套装效果",
      生命值: panel.hp,
      攻击力: panel.atk,
      防御力: panel.def,
      暴击率: `${panel.critRate}%`,
      暴击伤害: `${panel.critDmg}%`,
      元素充能效率: `${panel.energyRecharge}%`,
      元素精通: panel.elementalMastery,
      [`${activeElement.label}伤害加成`]: `${panel.elementalDmg}%`,
      额外伤害加成: panel.talentBonuses,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function shareResult() {
    const text = `${build.character.name}｜生命 ${formatNumber(panel.hp)}｜攻击 ${formatNumber(panel.atk)}｜双暴 ${panel.critRate}% / ${panel.critDmg}%`;
    if (navigator.share) {
      await navigator.share({ title: "原神最终面板", text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  const selectedCharacter = characters.find((item) => item.id === characterId);
  const selectedWeapon = weapons.find((item) => item.id === weaponId);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">✦</span>
          <span>
            <strong>原神伤害计算器</strong>
            <small>面板模拟 · v0.3</small>
          </span>
        </a>
        <nav className="top-actions" aria-label="页面操作">
          <button className="ghost-button" onClick={() => setHelpOpen(true)}>
            <span>◫</span>
            <span className="action-copy">使用说明</span>
          </button>
          <button className="ghost-button" onClick={reset}>
            <span>↻</span>
            <span className="action-copy">重置</span>
          </button>
        </nav>
      </header>

      <div className="workspace" id="top">
        <section className="element-tabs" aria-label="角色元素">
          {elements.map((element) => (
            <button
              className={build.element === element.key ? "active" : ""}
              key={element.key}
              onClick={() =>
                setBuild((current) => ({ ...current, element: element.key }))
              }
            >
              <span>{element.icon}</span>
              {element.label}
            </button>
          ))}
        </section>

        <div className="layout-grid">
          <section className="input-column" aria-label="面板输入">
            <div className="selection-grid">
              <article className="selection-card">
                <div className="card-kicker">
                  <span>角色</span>
                  <span className="status-dot">已载入</span>
                </div>
                <div className={`round-icon element-${build.element}`}>
                  {activeElement.icon}
                </div>
                <div className="selection-main">
                  <select
                    aria-label="选择角色"
                    value={characterId}
                    onChange={(event) => chooseCharacter(event.target.value)}
                  >
                    {characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </select>
                  <p>
                    {selectedCharacter?.level ?? build.character.level} 级
                    <span>·</span>
                    {selectedCharacter?.ascensionLabel ??
                      "使用当前基础属性"}
                  </p>
                </div>
              </article>

              <article className="selection-card">
                <div className="card-kicker">
                  <span>武器</span>
                  <span className="status-dot">特效已启用</span>
                </div>
                <div className="round-icon weapon-icon">⌁</div>
                <div className="selection-main">
                  <select
                    aria-label="选择武器"
                    value={weaponId}
                    onChange={(event) => chooseWeapon(event.target.value)}
                  >
                    {weapons.map((weapon) => (
                      <option key={weapon.id} value={weapon.id}>
                        {weapon.name}
                      </option>
                    ))}
                  </select>
                  <p>
                    {selectedWeapon?.level ?? build.weapon.level} 级
                    <span>·</span>
                    {selectedWeapon?.secondaryLabel ?? "使用当前副属性"}
                  </p>
                </div>
                {selectedWeapon ? (
                  <div className="weapon-passive">
                    <div className="weapon-passive-copy">
                      <strong>{selectedWeapon.passive.name}</strong>
                      <small>{selectedWeapon.passive.description}</small>
                    </div>
                    {selectedWeapon.passive.control ? (
                      <label className="passive-select">
                        <span>{selectedWeapon.passive.control.label}</span>
                        <select
                          aria-label={selectedWeapon.passive.control.label}
                          value={
                            build.weaponPassiveSelections?.[
                              selectedWeapon.passive.control.key
                            ] ??
                            selectedWeapon.passive.control.defaultValue
                          }
                          onChange={(event) =>
                            updateWeaponPassive(
                              selectedWeapon.passive.control!.key,
                              event.target.value,
                            )
                          }
                        >
                          {selectedWeapon.passive.control.options.map(
                            (option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    ) : (
                      <span
                        className={
                          selectedWeapon.passive.teammateDependent
                            ? "passive-badge excluded"
                            : "passive-badge"
                        }
                      >
                        {selectedWeapon.passive.teammateDependent
                          ? "队友效果暂不计算"
                          : "无条件选项"}
                      </span>
                    )}
                  </div>
                ) : null}
              </article>
            </div>

            <article className="panel input-panel">
              <button
                className="panel-heading"
                onClick={() => setArtifactOpen((value) => !value)}
                aria-expanded={artifactOpen}
              >
                <span>
                  <strong>圣遗物面板</strong>
                  <small>选择套装并填写详情页合计值</small>
                </span>
                <span className={artifactOpen ? "chevron open" : "chevron"}>
                  ⌄
                </span>
              </button>
              {artifactOpen ? (
                <div className="artifact-content">
                  <div className="artifact-set-picker">
                    <div className="artifact-set-controls">
                      <label className="artifact-set-field">
                        <span>套装选择</span>
                        <select
                          aria-label="选择圣遗物套装"
                          value={build.artifactSetId ?? "none"}
                          onChange={(event) =>
                            chooseArtifactSet(event.target.value)
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
                            updateArtifactSetPieces(event.target.value)
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
                                updateArtifactSetEffect(
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
                        选择套装与件数后，对应效果会加入最终面板。
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
                            ? activeElement.icon
                            : field.icon
                        }
                        value={build.artifact[field.key]}
                        onChange={(value) => updateArtifact(field.key, value)}
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
                  <small>预留接口，不参与基础面板换算</small>
                </div>
                <span className="future-badge">伤害公式预留</span>
              </div>
              <div className="talent-tabs" role="tablist" aria-label="攻击类型">
                {talentTabs.map((tab) => (
                  <button
                    role="tab"
                    aria-selected={activeTalent === tab.key}
                    className={activeTalent === tab.key ? "active" : ""}
                    key={tab.key}
                    onClick={() => setActiveTalent(tab.key)}
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
                <span>
                  {
                    talentTabs.find((tab) => tab.key === activeTalent)?.label
                  }{" "}
                 伤害加成
                </span>
                <div className="inline-number">
                  <input
                    aria-label="额外伤害加成"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    type="number"
                    value={build.talentBonuses[activeTalent]}
                    onChange={(event) =>
                      setBuild((current) => ({
                        ...current,
                        talentBonuses: {
                          ...current.talentBonuses,
                          [activeTalent]: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        },
                      }))
                    }
                  />
                  <span>%</span>
                </div>
              </div>
            </article>

            <article className="panel advanced-panel">
              <button
                className="panel-heading compact"
                onClick={() => setAdvancedOpen((value) => !value)}
                aria-expanded={advancedOpen}
              >
                <span>
                  <strong>自定义基础参数</strong>
                  <small>用于录入暂未收录的角色与武器</small>
                </span>
                <span className={advancedOpen ? "chevron open" : "chevron"}>
                  ⌄
                </span>
              </button>
              {advancedOpen ? (
                <div className="advanced-content">
                  <div className="advanced-group">
                    <h3>角色基础属性</h3>
                    <div className="mini-grid">
                      <NumberField
                        label="基础生命"
                        value={build.character.baseHp}
                        onChange={(value) =>
                          setBuild((current) => ({
                            ...current,
                            character: {
                              ...current.character,
                              baseHp: value,
                            },
                          }))
                        }
                      />
                      <NumberField
                        label="基础攻击"
                        value={build.character.baseAtk}
                        onChange={(value) =>
                          setBuild((current) => ({
                            ...current,
                            character: {
                              ...current.character,
                              baseAtk: value,
                            },
                          }))
                        }
                      />
                      <NumberField
                        label="基础防御"
                        value={build.character.baseDef}
                        onChange={(value) =>
                          setBuild((current) => ({
                            ...current,
                            character: {
                              ...current.character,
                              baseDef: value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="advanced-group">
                    <h3>武器基础属性</h3>
                    <div className="custom-weapon-row">
                      <NumberField
                        label="武器基础攻击"
                        value={build.weapon.baseAtk}
                        onChange={(value) =>
                          setBuild((current) => ({
                            ...current,
                            weapon: { ...current.weapon, baseAtk: value },
                          }))
                        }
                      />
                      <label className="select-field">
                        <span>武器副属性</span>
                        <select
                          value={build.weapon.secondaryStat}
                          onChange={(event) =>
                            setBuild((current) => ({
                              ...current,
                              weapon: {
                                ...current.weapon,
                                secondaryStat: event.target
                                  .value as SecondaryStatKey,
                              },
                            }))
                          }
                        >
                          {secondaryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NumberField
                        label="副属性数值"
                        value={build.weapon.secondaryValue}
                        onChange={(value) =>
                          setBuild((current) => ({
                            ...current,
                            weapon: {
                              ...current.weapon,
                              secondaryValue: value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </article>

            <button className="calculate-button" onClick={calculate}>
              <span className="calc-icon">▦</span>
              计算最终面板
            </button>
            <p className="calculate-note">
              <span>ⓘ</span>
              点击后根据当前输入生成结果，数据会自动保存在本机
            </p>
          </section>

          <aside className="panel result-panel" aria-live="polite">
            <div className="result-heading">
              <div>
                <span className={`result-element element-${build.element}`}>
                  {activeElement.icon}
                </span>
                <span>
                  <strong>最终面板</strong>
                  <small>
                    {build.character.name} · {build.weapon.name} ·{" "}
                    {build.artifactSetPieces
                      ? selectedArtifactSet.shortName
                      : "无套装"}
                  </small>
                </span>
              </div>
              <span className="theory-badge">理论值</span>
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
              <span>分类伤害加成</span>
              <div>
                {talentTabs.map((tab) => (
                  <b key={tab.key}>
                    {tab.label} {panel.talentBonuses[tab.key]}%
                  </b>
                ))}
              </div>
            </div>

            <div className="result-note">
              <span>ⓘ</span>
              <p>
                最终面板为理论计算值，仅供参考；
                <br />
                已计入当前武器与圣遗物套装自身效果；暂不计队友效果、敌方抗性与角色技能动态增益。
              </p>
            </div>

            <div className="result-actions">
              <button onClick={shareResult}>
                <span>⌯</span>分享结果
              </button>
              <button onClick={copyResult}>
                <span>{copied ? "✓" : "▣"}</span>
                {copied ? "已复制" : "复制数据"}
              </button>
            </div>
            <p className="updated-at">更新时间：{updatedAt}</p>
          </aside>
        </div>
      </div>

      {helpOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setHelpOpen(false)}
        >
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setHelpOpen(false)}
              aria-label="关闭使用说明"
            >
              ×
            </button>
            <span className="modal-icon">✦</span>
            <h2 id="help-title">如何录入</h2>
            <ol>
              <li>选择角色、武器和圣遗物套装，并设置触发条件。</li>
              <li>把游戏内圣遗物详情页的绿色加成合计录入对应字段。</li>
              <li>按需填写战技、爆发等额外伤害加成。</li>
              <li>点击“计算最终面板”，右侧或下方会生成结果。</li>
            </ol>
            <div className="formula-box">
              最终面板 = 基础属性 + 武器属性/特效 + 圣遗物属性/套装效果
            </div>
            <button className="modal-primary" onClick={() => setHelpOpen(false)}>
              开始录入
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
