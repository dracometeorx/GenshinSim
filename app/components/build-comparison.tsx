"use client";

import { useMemo, useState } from "react";
import type { BuildPlan } from "../../lib/build-plans";
import { createBuildComparisonEntries } from "../../lib/build-comparison";

const elementMeta = {
  cryo: { label: "冰", icon: "❄" },
  hydro: { label: "水", icon: "◉" },
  pyro: { label: "火", icon: "◆" },
  electro: { label: "雷", icon: "ϟ" },
  anemo: { label: "风", icon: "✤" },
  geo: { label: "岩", icon: "◇" },
  dendro: { label: "草", icon: "♧" },
} as const;

function formatDamage(value: number) {
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BuildComparison({
  activePlanId,
  hydrated,
  plans,
  onBack,
  onEditPlan,
}: {
  activePlanId: string;
  hydrated: boolean;
  plans: BuildPlan[];
  onBack: () => void;
  onEditPlan: (planId: string) => void;
}) {
  const [excludedPlanIds, setExcludedPlanIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [characterFilter, setCharacterFilter] = useState("all");
  const entries = useMemo(
    () => createBuildComparisonEntries(plans),
    [plans],
  );
  const availableCharacters = useMemo(
    () =>
      [...new Map(
        entries.map((entry) => [
          entry.characterId,
          entry.characterName,
        ]),
      )].map(([id, name]) => ({ id, name })),
    [entries],
  );
  const excluded = useMemo(
    () => new Set(excludedPlanIds),
    [excludedPlanIds],
  );
  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    return entries.filter(
      (entry) =>
        (characterFilter === "all" ||
          entry.characterId === characterFilter) &&
        (!keyword ||
          entry.plan.name.toLocaleLowerCase("zh-CN").includes(keyword) ||
          entry.characterName
            .toLocaleLowerCase("zh-CN")
            .includes(keyword) ||
          entry.weaponName
            .toLocaleLowerCase("zh-CN")
            .includes(keyword) ||
          entry.artifactName
            .toLocaleLowerCase("zh-CN")
            .includes(keyword)),
    );
  }, [characterFilter, entries, query]);
  const selectedEntries = entries.filter(
    (entry) => !excluded.has(entry.plan.id),
  );
  const rankedEntries = [...selectedEntries]
    .filter((entry) => entry.primaryDamage)
    .sort(
      (left, right) =>
        (right.primaryDamage?.expected ?? 0) -
        (left.primaryDamage?.expected ?? 0),
    );
  const maximumExpected =
    rankedEntries[0]?.primaryDamage?.expected ?? 0;
  const leader = rankedEntries[0];

  function togglePlan(planId: string) {
    setExcludedPlanIds((current) =>
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId],
    );
  }

  return (
    <section className="comparison-workspace" aria-label="方案伤害对比">
      <header className="comparison-hero">
        <div>
          <span className="comparison-kicker">BUILD COMPARISON</span>
          <h1>方案伤害对比</h1>
          <p>
            使用各方案保存的角色、队伍、武器、圣遗物与增益开关重新计算。
            不同角色的代表技能口径可能不同，请结合技能名称比较。
          </p>
        </div>
        <button className="comparison-back" type="button" onClick={onBack}>
          ← 返回当前方案编辑
        </button>
      </header>

      <div className="comparison-overview">
        <article>
          <span>参与对比</span>
          <strong>{selectedEntries.length}</strong>
          <small>共 {entries.length} 个已保存方案</small>
        </article>
        <article>
          <span>当前最高期望</span>
          <strong>
            {leader?.primaryDamage
              ? formatDamage(leader.primaryDamage.expected)
              : "—"}
          </strong>
          <small>
            {leader
              ? `${leader.plan.name} · ${leader.primaryDamage?.skillName}`
              : "选择至少一个有代表技能的方案"}
          </small>
        </article>
        <article>
          <span>当前编辑方案</span>
          <strong>
            {entries.find((entry) => entry.plan.id === activePlanId)
              ?.plan.name ?? "—"}
          </strong>
          <small>卡片中的“编辑此方案”可直接切换</small>
        </article>
      </div>

      <section className="comparison-ranking panel">
        <header>
          <span>
            <strong>最高期望伤害排行</strong>
            <small>每个方案取所有代表技能与反应结果中的最高期望值</small>
          </span>
          <b>{rankedEntries.length} 项</b>
        </header>
        {rankedEntries.length ? (
          <div className="ranking-list">
            {rankedEntries.map((entry, index) => {
              const expected = entry.primaryDamage?.expected ?? 0;
              const width =
                maximumExpected > 0
                  ? Math.max(4, (expected / maximumExpected) * 100)
                  : 0;
              return (
                <button
                  type="button"
                  className="ranking-row"
                  key={entry.plan.id}
                  onClick={() => onEditPlan(entry.plan.id)}
                  title={`编辑${entry.plan.name}`}
                >
                  <span className="ranking-position">{index + 1}</span>
                  <span className="ranking-name">
                    <b>{entry.plan.name}</b>
                    <small>
                      {entry.characterName} C{entry.constellation} ·{" "}
                      {entry.primaryDamage?.skillName} /{" "}
                      {entry.primaryDamage?.variantLabel}
                    </small>
                  </span>
                  <span className="ranking-track" aria-hidden="true">
                    <i style={{ width: `${width}%` }} />
                  </span>
                  <strong>{formatDamage(expected)}</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="comparison-empty">
            当前没有可用于排行的代表技能结果。
          </p>
        )}
      </section>

      <div className="comparison-toolbar">
        <label className="comparison-search">
          <span>⌕</span>
          <input
            type="search"
            value={query}
            placeholder="搜索方案、角色、武器或圣遗物"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="comparison-filter">
          <span>角色</span>
          <select
            value={characterFilter}
            onChange={(event) => setCharacterFilter(event.target.value)}
          >
            <option value="all">全部角色</option>
            {availableCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </label>
        <div className="comparison-selection-actions">
          <button
            type="button"
            onClick={() => setExcludedPlanIds([])}
          >
            全选
          </button>
          <button
            type="button"
            onClick={() =>
              setExcludedPlanIds(entries.map((entry) => entry.plan.id))
            }
          >
            清空
          </button>
        </div>
      </div>

      {!hydrated ? (
        <p className="comparison-empty">正在读取本地方案…</p>
      ) : filteredEntries.length ? (
        <div className="comparison-grid">
          {filteredEntries.map((entry) => {
            const selected = !excluded.has(entry.plan.id);
            const element =
              elementMeta[entry.element as keyof typeof elementMeta] ??
              elementMeta.cryo;
            const damageRows = [...entry.damages]
              .sort((left, right) => right.expected - left.expected)
              .slice(0, 4);
            return (
              <article
                className={`comparison-card element-card-${entry.element}${
                  selected ? "" : " excluded"
                }${
                  entry.plan.id === activePlanId ? " current" : ""
                }`}
                key={entry.plan.id}
              >
                <header className="comparison-card-heading">
                  <span
                    className={`comparison-element element-${entry.element}`}
                    aria-hidden="true"
                  >
                    {element.icon}
                  </span>
                  <span>
                    <button
                      type="button"
                      onClick={() => onEditPlan(entry.plan.id)}
                    >
                      {entry.plan.name}
                    </button>
                    <small>
                      {entry.characterName} C{entry.constellation} ·{" "}
                      {element.label}元素
                    </small>
                  </span>
                  <label className="comparison-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePlan(entry.plan.id)}
                    />
                    <span>参与</span>
                  </label>
                </header>

                <div className="comparison-build-meta">
                  <span>
                    <i>武器</i>
                    <b>{entry.weaponName}</b>
                    <small>精炼 {entry.weaponRefinement} 阶</small>
                  </span>
                  <span>
                    <i>圣遗物</i>
                    <b>{entry.artifactName}</b>
                    <small>
                      {entry.artifactPieces
                        ? `${entry.artifactPieces} 件套`
                        : "无套装效果"}
                    </small>
                  </span>
                </div>

                <section className="comparison-primary-damage">
                  <span>最高期望伤害</span>
                  <strong>
                    {entry.primaryDamage
                      ? formatDamage(entry.primaryDamage.expected)
                      : "暂无代表伤害"}
                  </strong>
                  <small>
                    {entry.primaryDamage
                      ? `${entry.primaryDamage.skillName} · ${entry.primaryDamage.variantLabel}`
                      : "自定义角色仅比较面板"}
                  </small>
                </section>

                <dl className="comparison-panel-stats">
                  <div>
                    <dt>生命</dt>
                    <dd>{formatDamage(entry.calculation.panel.hp)}</dd>
                  </div>
                  <div>
                    <dt>攻击</dt>
                    <dd>{formatDamage(entry.calculation.panel.atk)}</dd>
                  </div>
                  <div>
                    <dt>防御</dt>
                    <dd>{formatDamage(entry.calculation.panel.def)}</dd>
                  </div>
                  <div>
                    <dt>双暴</dt>
                    <dd>
                      {entry.calculation.panel.critRate}% /{" "}
                      {entry.calculation.panel.critDmg}%
                    </dd>
                  </div>
                </dl>

                <section className="comparison-damage-list">
                  <header>
                    <strong>代表伤害</strong>
                    <small>期望 / 暴击</small>
                  </header>
                  {damageRows.length ? (
                    damageRows.map((damage) => (
                      <div key={damage.id}>
                        <span>
                          <b>{damage.skillName}</b>
                          <small>{damage.variantLabel}</small>
                        </span>
                        <span>
                          <b>{formatDamage(damage.expected)}</b>
                          <small>{formatDamage(damage.crit)}</small>
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>当前角色没有代表技能数据。</p>
                  )}
                </section>

                <section className="comparison-team">
                  <header>
                    <strong>配队配置</strong>
                    <small>{entry.teammates.length}/3 名队友</small>
                  </header>
                  {entry.teammates.length ? (
                    <div>
                      {entry.teammates.map((teammate) => (
                        <article key={teammate.planId}>
                          <span>
                            <b>
                              {teammate.characterName} C
                              {teammate.constellation}
                            </b>
                            <small>{teammate.planName}</small>
                          </span>
                          <span>
                            <small>
                              {teammate.weaponName} R
                              {teammate.weaponRefinement}
                            </small>
                            <small>
                              {teammate.artifactName}
                              {teammate.artifactPieces
                                ? ` ${teammate.artifactPieces}件`
                                : ""}
                            </small>
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>未配置队友，按单角色方案计算。</p>
                  )}
                </section>

                <footer className="comparison-card-footer">
                  <small>
                    更新于 {formatUpdatedAt(entry.plan.updatedAt)}
                  </small>
                  <button
                    type="button"
                    onClick={() => onEditPlan(entry.plan.id)}
                  >
                    编辑此方案 →
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="comparison-empty">
          没有符合当前搜索条件的方案。
        </p>
      )}
    </section>
  );
}
