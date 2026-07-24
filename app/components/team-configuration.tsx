"use client";

import type { BuildPlan } from "../../lib/build-plans";
import { characters } from "../../lib/data/characters";
import type {
  ResolvedTeamBuff,
  TeamConfiguration,
} from "../../lib/team-types";

const sourceLabels = {
  constellation: "命座",
  character: "技能",
  weapon: "武器",
  artifact: "圣遗物",
  resonance: "共鸣",
} as const;

export function TeamConfigurationPanel({
  buffs,
  currentPlanId,
  currentCharacterId,
  plans,
  team,
  onBuffToggle,
  onSlotCharacterChange,
  onSlotPlanChange,
}: {
  buffs: readonly ResolvedTeamBuff[];
  currentPlanId: string;
  currentCharacterId: string;
  plans: readonly BuildPlan[];
  team: TeamConfiguration;
  onBuffToggle: (buffId: string, enabled: boolean) => void;
  onSlotCharacterChange: (
    slot: number,
    characterId: string | null,
  ) => void;
  onSlotPlanChange: (slot: number, planId: string) => void;
}) {
  const selectedCharacterIds = new Set(
    team.slots
      .map((slot) => slot.characterId)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <section className="panel team-configuration" aria-label="队伍配置">
      <header className="team-heading">
        <span>
          <strong>队伍配置</strong>
          <small>选择三名队友及其方案，逐项启用当前增益</small>
        </span>
        <b>{team.slots.filter((slot) => slot.characterId).length}/3</b>
      </header>

      <div className="team-slots">
        {team.slots.map((slot, index) => {
          const characterPlans = slot.characterId
            ? plans.filter(
                (plan) =>
                  plan.snapshot.characterId === slot.characterId &&
                  plan.id !== currentPlanId &&
                  (plan.id === slot.planId ||
                    !team.slots.some(
                      (otherSlot, otherIndex) =>
                        otherIndex !== index &&
                        otherSlot.planId === plan.id,
                    )),
              )
            : [];
          const resolvedPlanId =
            characterPlans.find((plan) => plan.id === slot.planId)
              ?.id ??
            characterPlans[0]?.id ??
            "";
          return (
            <article className="team-slot" key={index}>
              <span className="team-slot-index">{index + 1}</span>
              <label>
                <span>队友</span>
                <select
                  aria-label={`队友 ${index + 1}`}
                  value={slot.characterId ?? ""}
                  onChange={(event) =>
                    onSlotCharacterChange(
                      index,
                      event.target.value || null,
                    )
                  }
                >
                  <option value="">未配置</option>
                  {characters
                    .filter(
                      (character) =>
                        (character.id !== currentCharacterId ||
                          character.id === "custom") &&
                        (character.id === "custom" ||
                          character.id === slot.characterId ||
                          !selectedCharacterIds.has(character.id)),
                    )
                    .map((character) => (
                      <option
                        key={character.id}
                        value={character.id}
                      >
                        {character.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>队友方案</span>
                <select
                  aria-label={`队友 ${index + 1} 方案`}
                  disabled={!slot.characterId || !characterPlans.length}
                  value={resolvedPlanId}
                  onChange={(event) =>
                    onSlotPlanChange(index, event.target.value)
                  }
                >
                  {!characterPlans.length ? (
                    <option value="">自动创建默认方案</option>
                  ) : null}
                  {characterPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · C{plan.snapshot.constellation ?? 0}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          );
        })}
      </div>

      <div className="team-buffs">
        <div className="team-buff-heading">
          <strong>可用增益</strong>
          <small>开关状态保存在当前角色方案中</small>
        </div>
        {buffs.length ? (
          <div className="team-buff-list">
            {buffs.map((buff) => (
              <label className="team-buff" key={buff.id}>
                <input
                  type="checkbox"
                  checked={buff.enabled}
                  onChange={(event) =>
                    onBuffToggle(buff.id, event.target.checked)
                  }
                />
                <span>
                  <b>
                    {buff.name}
                    <i>{sourceLabels[buff.sourceKind]}</i>
                  </b>
                  <small>
                    {buff.sourceName} · {buff.description}
                  </small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="team-buff-empty">
            当前队伍没有可计入单次伤害的增益。产球、充能与冷却效果不会列入。
          </p>
        )}
      </div>
    </section>
  );
}
