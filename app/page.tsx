"use client";

import { useMemo, useState } from "react";
import { ArtifactInput } from "./components/artifact-input";
import { CharacterWeaponSelection } from "./components/character-weapon-selection";
import { HelpModal } from "./components/help-modal";
import {
  PlanDialog,
  type PlanDialogState,
} from "./components/plan-dialog";
import { ResultPanel } from "./components/result-panel";
import { useBuildPlans } from "./hooks/use-build-plans";
import { copyText, shareOrCopy } from "../lib/browser-actions";
import {
  clampRefinement,
  getWeaponPassiveSelections,
} from "../lib/build-plan-runtime";
import { calculateBuild } from "../lib/calculation";
import type { BuildInput, ElementKey } from "../lib/calculator";
import { getArtifactSet } from "../lib/data/artifacts";
import { characters } from "../lib/data/characters";
import {
  createResultPayload,
  createShareText,
} from "../lib/result-export";
import {
  getCompatibleWeapons,
  isWeaponCompatible,
  weapons,
} from "../lib/data/weapons";

const elements: Array<{
  key: ElementKey;
  label: string;
  icon: string;
}> = [
  { key: "cryo", label: "冰元素", icon: "❄" },
  { key: "hydro", label: "水元素", icon: "◉" },
  { key: "pyro", label: "火元素", icon: "◆" },
  { key: "electro", label: "雷元素", icon: "ϟ" },
  { key: "anemo", label: "风元素", icon: "✤" },
  { key: "geo", label: "岩元素", icon: "◇" },
  { key: "dendro", label: "草元素", icon: "♧" },
];

export default function Home() {
  const {
    activePlanId,
    build,
    characterId,
    chooseCharacter,
    choosePlan,
    createPlan,
    damageSettings,
    deletePlan,
    hydrated,
    plans,
    renamePlan,
    resetPlan,
    setBuild,
    setDamageSettings,
    setStatus,
    setWeaponId,
    status: updatedAt,
    storageError,
    weaponId,
  } = useBuildPlans();
  const [activeTalent, setActiveTalent] =
    useState<keyof BuildInput["talentBonuses"]>("skill");
  const [artifactOpen, setArtifactOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [operationNotice, setOperationNotice] = useState("");
  const [planDialog, setPlanDialog] =
    useState<PlanDialogState | null>(null);

  const activeElement = useMemo(
    () =>
      elements.find((element) => element.key === build.element) ??
      elements[0],
    [build.element],
  );
  const selectedArtifactSet = useMemo(
    () => getArtifactSet(build.artifactSetId),
    [build.artifactSetId],
  );
  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === characterId),
    [characterId],
  );
  const characterPlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.snapshot.characterId === characterId,
      ),
    [characterId, plans],
  );
  const compatibleWeapons = useMemo(
    () =>
      selectedCharacter
        ? getCompatibleWeapons(selectedCharacter.weaponType)
        : weapons,
    [selectedCharacter],
  );
  const selectedWeapon = useMemo(
    () => weapons.find((weapon) => weapon.id === weaponId),
    [weaponId],
  );
  const calculation = useMemo(
    () =>
      calculateBuild({
        build,
        character: selectedCharacter ?? characters[0],
        settings: damageSettings,
      }),
    [build, damageSettings, selectedCharacter],
  );

  function createNewPlan() {
    const characterPlanCount = plans.filter(
      (plan) => plan.snapshot.characterId === characterId,
    ).length;
    const suggestedName = `${build.character.name}方案 ${
      characterPlanCount + 1
    }`;
    setPlanDialog({ kind: "create", value: suggestedName });
  }

  function renameActivePlan() {
    const activePlan = plans.find((plan) => plan.id === activePlanId);
    if (!activePlan) return;
    setPlanDialog({ kind: "rename", value: activePlan.name });
  }

  function deleteActivePlan() {
    const currentCharacterPlans = plans.filter(
      (plan) => plan.snapshot.characterId === characterId,
    );
    if (currentCharacterPlans.length <= 1) return;
    const activePlan = plans.find((plan) => plan.id === activePlanId);
    if (!activePlan) return;
    setPlanDialog({ kind: "delete", value: activePlan.name });
  }

  function confirmPlanDialog() {
    if (!planDialog) return;
    const value = planDialog.value.trim();
    if (planDialog.kind === "create" && value) createPlan(value);
    if (planDialog.kind === "rename" && value) renamePlan(value);
    if (planDialog.kind === "delete") deletePlan();
    setPlanDialog(null);
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

  function updateWeaponRefinement(value: string) {
    const refinement = clampRefinement(Number(value));
    setBuild((current) => ({
      ...current,
      weapon: { ...current.weapon, refinement },
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
          hutaoHpState:
            value === "below50" ? "below50" : "above50",
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
          homaHpState:
            value === "below50" ? "below50" : "above50",
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
    setStatus(
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
    resetPlan();
    setOperationNotice("");
  }

  async function copyResult() {
    const payload = createResultPayload({
      artifactSetName: selectedArtifactSet.name,
      build,
      elementLabel: activeElement.label,
      result: calculation,
      settings: damageSettings,
    });
    try {
      await copyText(
        JSON.stringify(payload, null, 2),
        navigator.clipboard?.writeText.bind(navigator.clipboard),
      );
      setOperationNotice("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setOperationNotice("复制失败，请检查浏览器的剪贴板权限。");
    }
  }

  async function shareResult() {
    const text = createShareText(build, calculation);
    try {
      const outcome = await shareOrCopy(
        { title: "原神最终面板", text },
        {
          share: navigator.share?.bind(navigator),
          writeText:
            navigator.clipboard?.writeText.bind(navigator.clipboard),
        },
      );
      if (outcome === "copied") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
      if (outcome === "cancelled") return;
      setOperationNotice("");
    } catch {
      setOperationNotice("分享失败，请稍后重试或使用复制数据。");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">✦</span>
          <span>
            <strong>原神伤害计算器</strong>
            <small>面板与技能伤害 · v0.7</small>
          </span>
        </a>
        <nav className="top-actions" aria-label="页面操作">
          <button
            className="ghost-button"
            onClick={() => setHelpOpen(true)}
          >
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
              className={
                build.element === element.key ? "active" : ""
              }
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
            <CharacterWeaponSelection
              activeElement={activeElement}
              activePlanId={activePlanId}
              build={build}
              characterId={characterId}
              characterPlans={characterPlans}
              compatibleWeapons={compatibleWeapons}
              hydrated={hydrated}
              selectedCharacter={selectedCharacter}
              selectedWeapon={selectedWeapon}
              weaponId={weaponId}
              onCharacterChange={chooseCharacter}
              onCreatePlan={createNewPlan}
              onDeletePlan={deleteActivePlan}
              onPlanChange={choosePlan}
              onRenamePlan={renameActivePlan}
              onWeaponChange={chooseWeapon}
              onWeaponPassiveChange={updateWeaponPassive}
              onWeaponRefinementChange={updateWeaponRefinement}
            />

            <ArtifactInput
              activeElementIcon={activeElement.icon}
              activeTalent={activeTalent}
              build={build}
              open={artifactOpen}
              selectedArtifactSet={selectedArtifactSet}
              onArtifactChange={updateArtifact}
              onArtifactEffectChange={updateArtifactSetEffect}
              onArtifactSetChange={chooseArtifactSet}
              onArtifactSetPiecesChange={updateArtifactSetPieces}
              onOpenChange={setArtifactOpen}
              onTalentChange={setActiveTalent}
              setBuild={setBuild}
            />

            <button className="calculate-button" onClick={calculate}>
              <span className="calc-icon">▦</span>
              查看面板与技能伤害
            </button>
            <p className="calculate-note">
              <span>ⓘ</span>
              结果随输入实时更新；按钮仅用于滚动到结果区
            </p>
          </section>

          <ResultPanel
            activeElement={activeElement}
            artifactSetName={selectedArtifactSet.shortName}
            build={build}
            calculation={calculation}
            copied={copied}
            damageSettings={damageSettings}
            operationNotice={operationNotice}
            selectedCharacter={selectedCharacter}
            storageError={storageError}
            updatedAt={updatedAt}
            onCopy={copyResult}
            onDamageSelection={updateDamageSelection}
            onShare={shareResult}
            setDamageSettings={setDamageSettings}
          />
        </div>
      </div>

      {helpOpen ? (
        <HelpModal onClose={() => setHelpOpen(false)} />
      ) : null}
      {planDialog ? (
        <PlanDialog
          dialog={planDialog}
          onCancel={() => setPlanDialog(null)}
          onConfirm={confirmPlanDialog}
          onValueChange={(value) =>
            setPlanDialog((current) =>
              current ? { ...current, value } : current,
            )
          }
        />
      ) : null}
    </main>
  );
}
