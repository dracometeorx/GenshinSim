"use client";

import type { BuildPlan } from "../../lib/build-plans";
import { clampRefinement } from "../../lib/build-plan-runtime";
import type { BuildInput } from "../../lib/calculator";
import { characters, type CharacterPreset } from "../../lib/data/characters";
import {
  type WeaponPreset,
  weaponTypeLabels,
} from "../../lib/data/weapons";
import { BuildPlanManager } from "./build-plan-manager";

export function CharacterWeaponSelection({
  activeElement,
  activePlanId,
  build,
  characterId,
  characterPlans,
  compatibleWeapons,
  hydrated,
  selectedCharacter,
  selectedWeapon,
  weaponId,
  onCharacterChange,
  onCreatePlan,
  onDeletePlan,
  onPlanChange,
  onRenamePlan,
  onWeaponChange,
  onWeaponPassiveChange,
  onWeaponRefinementChange,
}: {
  activeElement: { icon: string };
  activePlanId: string;
  build: BuildInput;
  characterId: string;
  characterPlans: BuildPlan[];
  compatibleWeapons: WeaponPreset[];
  hydrated: boolean;
  selectedCharacter?: CharacterPreset;
  selectedWeapon?: WeaponPreset;
  weaponId: string;
  onCharacterChange: (id: string) => void;
  onCreatePlan: () => void;
  onDeletePlan: () => void;
  onPlanChange: (id: string) => void;
  onRenamePlan: () => void;
  onWeaponChange: (id: string) => void;
  onWeaponPassiveChange: (key: string, value: string) => void;
  onWeaponRefinementChange: (value: string) => void;
}) {
  return (
    <div className="selection-grid">
      <article className="selection-card character-card">
        <div className="card-kicker">
          <span>角色</span>
          <span className="status-dot">
            {hydrated ? "方案自动保存" : "方案载入中"}
          </span>
        </div>
        <div className={`round-icon element-${build.element}`}>
          {activeElement.icon}
        </div>
        <div className="selection-main">
          <select
            aria-label="选择角色"
            value={characterId}
            onChange={(event) =>
              onCharacterChange(event.target.value)
            }
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
            {selectedCharacter?.ascensionLabel ?? "使用当前基础属性"}
          </p>
        </div>
        <BuildPlanManager
          activePlanId={activePlanId}
          hydrated={hydrated}
          plans={characterPlans}
          onChoose={onPlanChange}
          onCreate={onCreatePlan}
          onRename={onRenamePlan}
          onDelete={onDeletePlan}
        />
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
            onChange={(event) => onWeaponChange(event.target.value)}
          >
            {compatibleWeapons.map((weapon) => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name}
              </option>
            ))}
          </select>
          <div className="weapon-meta-row">
            <p>
              {selectedWeapon?.level ?? build.weapon.level} 级
              <span>·</span>
              {selectedWeapon
                ? weaponTypeLabels[selectedWeapon.weaponType]
                : "武器类型未设置"}
              <span>·</span>
              {selectedWeapon?.secondaryLabel ?? "使用当前副属性"}
            </p>
            <label className="refinement-picker">
              <span>精炼</span>
              <select
                aria-label="武器精炼等级"
                value={build.weapon.refinement}
                onChange={(event) =>
                  onWeaponRefinementChange(event.target.value)
                }
              >
                {[1, 2, 3, 4, 5].map((refinement) => (
                  <option key={refinement} value={refinement}>
                    {refinement} 阶
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {selectedWeapon ? (
          <div className="weapon-passive">
            <div className="weapon-passive-copy">
              <strong>{selectedWeapon.passive.name}</strong>
              <small>
                {selectedWeapon.passive.refinementDescriptions?.[
                  clampRefinement(build.weapon.refinement) - 1
                ] ?? selectedWeapon.passive.description}
              </small>
            </div>
            {selectedWeapon.passive.control ? (
              <label className="passive-select">
                <span>{selectedWeapon.passive.control.label}</span>
                <select
                  aria-label={selectedWeapon.passive.control.label}
                  value={
                    build.weaponPassiveSelections?.[
                      selectedWeapon.passive.control.key
                    ] ?? selectedWeapon.passive.control.defaultValue
                  }
                  onChange={(event) =>
                    onWeaponPassiveChange(
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
  );
}
