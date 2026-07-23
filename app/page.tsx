"use client";

import { useEffect, useMemo, useState } from "react";
import {
  artifactSets,
  getArtifactSet,
} from "../lib/data/artifacts";
import {
  characters,
  type CharacterPreset,
} from "../lib/data/characters";
import {
  getCompatibleWeapons,
  isWeaponCompatible,
  weaponTypeLabels,
  weapons,
  type WeaponPreset,
} from "../lib/data/weapons";
import {
  BuildInput,
  ElementKey,
  FinalPanel,
  SecondaryStatKey,
  calculateFinalPanel,
} from "../lib/calculator";
import {
  DamageSettings,
  calculateRepresentativeDamage,
  defaultDamageSettings,
} from "../lib/damage";

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

const storageKey = "genshin-panel-build-v5";
const previousStorageKeys = [
  "genshin-panel-build-v4",
  "genshin-panel-build-v3",
  "genshin-panel-build-v2",
  "genshin-panel-build-v1",
];

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

function getPreferredWeapon(character: CharacterPreset) {
  const preferred = weapons.find(
    (weapon) =>
      weapon.id === character.defaultWeaponId &&
      isWeaponCompatible(character.weaponType, weapon),
  );
  return preferred ?? getCompatibleWeapons(character.weaponType)[0] ?? weapons[0];
}

function getWeaponPassiveSelections(
  weapon: WeaponPreset,
  character: CharacterPreset,
  settings: DamageSettings,
  currentSelections?: Record<string, string>,
) {
  const control = weapon.passive.control;
  if (!control) return {};
  const value =
    weapon.id === "homa" && character.id === "hutao"
      ? settings.selections.hutaoHpState === "below50"
        ? "below50"
        : "above50"
      : currentSelections?.[control.key] ?? control.defaultValue;
  return { [control.key]: value };
}

export default function Home() {
  const [build, setBuild] = useState<BuildInput>(defaultBuild);
  const [panel, setPanel] = useState<FinalPanel>(() =>
    calculateFinalPanel(defaultBuild),
  );
  const [damageSettings, setDamageSettings] = useState<DamageSettings>(() => ({
    ...defaultDamageSettings,
    selections: { ...defaultDamageSettings.selections },
  }));
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
      const sourceKey = [storageKey, ...previousStorageKeys].find((key) =>
        window.localStorage.getItem(key),
      );
      const persisted = sourceKey
        ? window.localStorage.getItem(sourceKey)
        : null;
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as {
            build: BuildInput | LegacyBuildInput;
            characterId: string;
            weaponId: string;
            damageSettings?: Partial<DamageSettings>;
          };
          const restoredBuild = sourceKey === "genshin-panel-build-v1"
            ? migrateLegacyBuild(parsed.build as LegacyBuildInput)
            : (parsed.build as BuildInput);
          const restoredDamageSettings: DamageSettings = {
            ...defaultDamageSettings,
            ...parsed.damageSettings,
            selections: {
              ...defaultDamageSettings.selections,
              ...parsed.damageSettings?.selections,
            },
          };
          const restoredCharacter =
            characters.find(
              (character) => character.id === parsed.characterId,
            ) ??
            characters.find(
              (character) => character.name === restoredBuild.character.name,
            ) ??
            characters[0];
          const requestedWeapon =
            weapons.find((weapon) => weapon.id === parsed.weaponId) ??
            weapons.find(
              (weapon) => weapon.name === restoredBuild.weapon.name,
            );
          const compatibleWeapon =
            requestedWeapon &&
            isWeaponCompatible(
              restoredCharacter.weaponType,
              requestedWeapon,
            )
              ? requestedWeapon
              : getPreferredWeapon(restoredCharacter);
          const keepRestoredWeapon =
            requestedWeapon?.id === compatibleWeapon.id &&
            restoredBuild.weapon.name === compatibleWeapon.name;
          const normalizedBuild: BuildInput = {
            ...restoredBuild,
            character:
              restoredBuild.character.name === restoredCharacter.name
                ? restoredBuild.character
                : restoredCharacter,
            weapon: keepRestoredWeapon
              ? restoredBuild.weapon
              : compatibleWeapon,
            element:
              restoredCharacter.id === "custom"
                ? restoredBuild.element
                : restoredCharacter.element,
            weaponPassiveSelections: getWeaponPassiveSelections(
              compatibleWeapon,
              restoredCharacter,
              restoredDamageSettings,
              keepRestoredWeapon
                ? restoredBuild.weaponPassiveSelections
                : undefined,
            ),
            artifactSetId: restoredBuild.artifactSetId ?? "none",
            artifactSetPieces: restoredBuild.artifactSetPieces ?? 0,
            artifactSetSelections:
              restoredBuild.artifactSetSelections ?? {},
          };
          setBuild(normalizedBuild);
          setPanel(calculateFinalPanel(normalizedBuild));
          setCharacterId(restoredCharacter.id);
          setWeaponId(compatibleWeapon.id);
          setDamageSettings(restoredDamageSettings);
          setUpdatedAt(
            sourceKey === storageKey ? "已恢复" : "已迁移旧版数据",
          );
          if (sourceKey !== storageKey) {
            previousStorageKeys.forEach((key) =>
              window.localStorage.removeItem(key),
            );
          }
        } catch {
          window.localStorage.removeItem(storageKey);
          previousStorageKeys.forEach((key) =>
            window.localStorage.removeItem(key),
          );
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
      JSON.stringify({
        build,
        characterId,
        weaponId,
        damageSettings,
      }),
    );
  }, [build, characterId, damageSettings, hydrated, weaponId]);

  const activeElement = useMemo(
    () => elements.find((element) => element.key === build.element) ?? elements[0],
    [build.element],
  );
  const selectedArtifactSet = useMemo(
    () => getArtifactSet(build.artifactSetId),
    [build.artifactSetId],
  );
  const selectedCharacter = useMemo(
    () => characters.find((item) => item.id === characterId),
    [characterId],
  );
  const compatibleWeapons = useMemo(
    () =>
      selectedCharacter
        ? getCompatibleWeapons(selectedCharacter.weaponType)
        : weapons,
    [selectedCharacter],
  );
  const selectedWeapon = useMemo(
    () => weapons.find((item) => item.id === weaponId),
    [weaponId],
  );
  const damageResult = useMemo(
    () =>
      selectedCharacter
        ? calculateRepresentativeDamage(
            selectedCharacter,
            build,
            panel,
            damageSettings,
          )
        : null,
    [build, damageSettings, panel, selectedCharacter],
  );

  function chooseCharacter(id: string) {
    const character = characters.find((item) => item.id === id);
    if (!character) return;
    const currentWeapon = weapons.find((item) => item.id === weaponId);
    const nextWeapon =
      currentWeapon &&
      isWeaponCompatible(character.weaponType, currentWeapon)
        ? currentWeapon
        : getPreferredWeapon(character);
    setCharacterId(id);
    setWeaponId(nextWeapon.id);
    setBuild((current) => {
      const weaponChanged = currentWeapon?.id !== nextWeapon.id;
      return {
        ...current,
        character,
        weapon: weaponChanged ? nextWeapon : current.weapon,
        weaponPassiveSelections: getWeaponPassiveSelections(
          nextWeapon,
          character,
          damageSettings,
          weaponChanged ? undefined : current.weaponPassiveSelections,
        ),
        element: character.element,
      };
    });
  }

  function chooseWeapon(id: string) {
    const weapon = weapons.find((item) => item.id === id);
    if (
      !weapon ||
      !selectedCharacter ||
      !isWeaponCompatible(selectedCharacter.weaponType, weapon)
    ) {
      return;
    }
    setWeaponId(id);
    setBuild((current) => ({
      ...current,
      weapon,
      weaponPassiveSelections: getWeaponPassiveSelections(
        weapon,
        selectedCharacter,
        damageSettings,
      ),
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
    if (key === "homaHpState") {
      setDamageSettings((current) => ({
        ...current,
        selections: {
          ...current.selections,
          hutaoHpState: value === "below50" ? "below50" : "above50",
        },
      }));
    }
  }

  function updateDamageSelection(key: string, value: string) {
    setDamageSettings((current) => ({
      ...current,
      selections: {
        ...current.selections,
        [key]: value,
      },
    }));
    if (key === "hutaoHpState" && build.weapon.id === "homa") {
      setBuild((current) => ({
        ...current,
        weaponPassiveSelections: {
          ...current.weaponPassiveSelections,
          homaHpState: value === "below50" ? "below50" : "above50",
        },
      }));
    }
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
    setDamageSettings({
      ...defaultDamageSettings,
      selections: { ...defaultDamageSettings.selections },
    });
    setCharacterId("ayaka");
    setWeaponId("mistsplitter");
    setUpdatedAt("已重置");
    window.localStorage.removeItem(storageKey);
    previousStorageKeys.forEach((key) =>
      window.localStorage.removeItem(key),
    );
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
      敌人: {
        等级: damageSettings.enemyLevel,
        元素抗性: `${damageSettings.enemyResistance}%`,
      },
      代表技能伤害: Object.fromEntries(
        (damageResult?.skills ?? []).map((skill) => [
          skill.name,
          Object.fromEntries(
            skill.variants.map((variant) => [
              variant.label,
              {
                未暴击: variant.nonCrit,
                暴击: variant.crit,
                期望: variant.expected,
              },
            ]),
          ),
        ]),
      ),
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">✦</span>
          <span>
            <strong>原神伤害计算器</strong>
            <small>面板与技能伤害 · v0.5</small>
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
              disabled={characterId !== "custom"}
              aria-pressed={build.element === element.key}
              key={element.key}
              onClick={() => {
                if (characterId === "custom") {
                  setBuild((current) => ({
                    ...current,
                    element: element.key,
                  }));
                }
              }}
              title={
                characterId === "custom"
                  ? `设置自定义角色为${element.label}`
                  : "元素由当前角色自动绑定"
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
                    {selectedCharacter
                      ? weaponTypeLabels[selectedCharacter.weaponType]
                      : "武器类型未设置"}
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
                    {compatibleWeapons.map((weapon) => (
                      <option key={weapon.id} value={weapon.id}>
                        {weapon.name}
                      </option>
                    ))}
                  </select>
                  <p>
                    {selectedWeapon?.level ?? build.weapon.level} 级
                    <span>·</span>
                    {selectedWeapon
                      ? weaponTypeLabels[selectedWeapon.weaponType]
                      : "武器类型未设置"}
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
              计算面板与技能伤害
            </button>
            <p className="calculate-note">
              <span>ⓘ</span>
              默认敌人 105 级、10% 抗性，参数可在结果区调整
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

            <section className="damage-section" aria-label="代表技能伤害">
              <div className="damage-heading">
                <span>
                  <strong>代表技能伤害</strong>
                  <small>单目标 · 含防御、抗性与元素反应</small>
                </span>
                <span className="damage-badge">Lv.{damageSettings.talentLevel}</span>
              </div>

              <div className="damage-settings">
                <label>
                  <span>
                    {selectedCharacter?.damageProfile?.talentLabel ??
                      "天赋等级"}
                  </span>
                  <select
                    aria-label="选择天赋等级"
                    value={damageSettings.talentLevel}
                    onChange={(event) =>
                      setDamageSettings((current) => ({
                        ...current,
                        talentLevel: Number(event.target.value),
                      }))
                    }
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(
                      (level) => (
                        <option key={level} value={level}>
                          {level} 级
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  <span>敌人等级</span>
                  <input
                    aria-label="敌人等级"
                    inputMode="numeric"
                    min="1"
                    max="200"
                    type="number"
                    value={damageSettings.enemyLevel}
                    onChange={(event) =>
                      setDamageSettings((current) => ({
                        ...current,
                        enemyLevel: Math.min(
                          200,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>元素抗性</span>
                  <span className="compact-number">
                    <input
                      aria-label="敌人元素抗性"
                      inputMode="decimal"
                      min="-100"
                      max="1000"
                      step="0.1"
                      type="number"
                      value={damageSettings.enemyResistance}
                      onChange={(event) =>
                        setDamageSettings((current) => ({
                          ...current,
                          enemyResistance: Math.min(
                            1000,
                            Math.max(
                              -100,
                              Number(event.target.value) || 0,
                            ),
                          ),
                        }))
                      }
                    />
                    <i>%</i>
                  </span>
                </label>
                {selectedCharacter?.damageProfile?.controls.map((control) => (
                  <label key={control.key}>
                    <span>{control.label}</span>
                    <select
                      aria-label={control.label}
                      value={
                        damageSettings.selections[control.key] ??
                        control.defaultValue
                      }
                      onChange={(event) =>
                        updateDamageSelection(
                          control.key,
                          event.target.value,
                        )
                      }
                    >
                      {control.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {damageResult?.skills.length ? (
                <div className="damage-skills">
                  {damageResult.skills.map((skill) => (
                    <article className="damage-skill" key={skill.id}>
                      <div className="damage-skill-title">
                        <span>
                          <strong>{skill.name}</strong>
                          <small>{skill.description}</small>
                        </span>
                        <b>{skill.multiplierLabel}</b>
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
                            <span role="cell">
                              {formatNumber(variant.expected)}
                            </span>
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

              {damageResult ? (
                <p className="damage-formula-note">
                  防御倍率{" "}
                  {(damageResult.defenseMultiplier * 100).toFixed(1)}% ·
                  有效抗性 {damageResult.effectiveResistance.toFixed(1)}% ·
                  抗性倍率{" "}
                  {(damageResult.resistanceMultiplier * 100).toFixed(1)}%
                </p>
              ) : null}
            </section>

            <div className="result-note">
              <span>ⓘ</span>
              <p>
                技能伤害为理论单目标值；
                <br />
                已计入角色自身机制、武器与套装效果，暂不计队友效果、命座与敌人防御降低。
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
              <li>点击计算后，在结果区调整天赋等级、敌人等级与抗性。</li>
              <li>代表技能会同时显示未暴击、暴击和暴击期望伤害。</li>
            </ol>
            <div className="formula-box">
              技能伤害 = 技能基础值 × 增伤 × 防御倍率 × 抗性倍率 ×
              暴击/反应倍率
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
