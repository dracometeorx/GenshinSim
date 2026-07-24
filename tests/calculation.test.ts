import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBuild as calculateResolvedBuild,
  type CalculationRequest,
} from "../lib/calculation.ts";
import {
  createResultPayload,
  createShareText,
} from "../lib/result-export.ts";
import {
  createBuildPlan,
  createBuildPlanSnapshot,
} from "../lib/build-plans.ts";
import type { BuildInput } from "../lib/calculator.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import { ayaka } from "../lib/data/characters/ayaka.ts";
import { customCharacter } from "../lib/data/characters/custom.ts";
import { hutao } from "../lib/data/characters/hutao.ts";
import { nahida } from "../lib/data/characters/nahida.ts";
import { raiden } from "../lib/data/characters/raiden.ts";
import type { CharacterPreset } from "../lib/data/characters/types.ts";
import { customWeapon } from "../lib/data/weapons/custom.ts";
import { dreams } from "../lib/data/weapons/dreams.ts";
import { engulfing } from "../lib/data/weapons/engulfing.ts";
import { favoniusLance } from "../lib/data/weapons/favonius-lance.ts";
import { homa } from "../lib/data/weapons/homa.ts";
import { mistsplitter } from "../lib/data/weapons/mistsplitter.ts";
import { theCatch } from "../lib/data/weapons/the-catch.ts";
import type { WeaponPreset } from "../lib/data/weapons/types.ts";
import { getArtifactSet } from "../lib/data/artifacts/index.ts";
import { createTeamCalculationInput } from "../lib/team.ts";
import { createEmptyTeamConfiguration } from "../lib/team-types.ts";

function calculateBuild(
  request: Omit<CalculationRequest, "weapon" | "artifactSet">,
) {
  return calculateResolvedBuild({
    ...request,
    weapon: mistsplitter,
    artifactSet: getArtifactSet(request.build.artifactSetId),
  });
}

const build: BuildInput = {
  element: "cryo",
  character: ayaka,
  weapon: mistsplitter,
  weaponPassiveSelections: { mistsplitterStacks: "0" },
  artifactSetId: "blizzard-strayer",
  artifactSetPieces: 4,
  artifactSetSelections: { blizzardEnemyState: "frozen" },
  artifact: {
    flatHp: 0,
    flatAtk: 0,
    flatDef: 0,
    critRate: 0,
    critDmg: 0,
    energyRecharge: 0,
    elementalMastery: 0,
    elementalDmg: 0,
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

function buildFor(
  character: CharacterPreset,
  weapon: WeaponPreset,
  options: {
    artifactSetId?: string;
    artifactSetPieces?: 0 | 2 | 4;
    element?: BuildInput["element"];
  } = {},
): BuildInput {
  return {
    ...build,
    element: options.element ?? character.element,
    character,
    weapon,
    weaponPassiveSelections: {},
    artifactSetId: options.artifactSetId ?? "none",
    artifactSetPieces: options.artifactSetPieces ?? 0,
    artifactSetSelections: {},
    artifact: { ...build.artifact },
    talentBonuses: { ...build.talentBonuses },
  };
}

function createTeammatePlan({
  character,
  weapon,
  constellation = 0,
  artifactSetId = "none",
  artifactSetPieces = 0,
  element,
}: {
  character: CharacterPreset;
  weapon: WeaponPreset;
  constellation?: number;
  artifactSetId?: string;
  artifactSetPieces?: 0 | 2 | 4;
  element?: BuildInput["element"];
}) {
  const teammateBuild = buildFor(character, weapon, {
    artifactSetId,
    artifactSetPieces,
    element,
  });
  return createBuildPlan(
    createBuildPlanSnapshot({
      build: teammateBuild,
      characterId: character.id,
      weaponId: weapon.id,
      damageSettings: defaultDamageSettings,
      constellation,
    }),
    `${character.name}队友方案`,
    { id: `${character.id}-team-plan` },
  );
}

function teamWithPlan(
  plan: ReturnType<typeof createTeammatePlan>,
  buffToggles: Record<string, boolean> = {},
) {
  const configuration = createEmptyTeamConfiguration();
  configuration.slots[0] = {
    characterId: plan.snapshot.characterId,
    planId: plan.id,
  };
  configuration.buffToggles = { ...buffToggles };
  return createTeamCalculationInput(configuration, [plan]);
}

test("derives panel and damage from one request", () => {
  const result = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });

  assert.equal(result.panel.critRate, 45);
  assert.ok(result.skills.length > 0);
  assert.equal(result.defenseMultiplier, 190 / 395);
});

test("does not calculate Melt for Ayaka's representative skill", () => {
  const result = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const skill = result.skills.find(
    (item) => item.id === "ayaka-skill",
  );

  assert.deepEqual(
    skill?.variants.map(({ reaction }) => reaction),
    ["none"],
  );
  assert.equal(result.warnings.length, 0);
});

test("separates static panel from selected combat conditions", () => {
  const result = calculateResolvedBuild({
    build: {
      ...build,
      weaponPassiveSelections: { mistsplitterStacks: "3" },
    },
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet(build.artifactSetId),
    settings: defaultDamageSettings,
  });

  assert.equal(result.panel, result.combatPanel);
  assert.equal(result.staticPanel.critRate, 5);
  assert.equal(result.combatPanel.critRate, 45);
  assert.equal(result.staticPanel.elementalDmg, 27);
  assert.equal(result.combatPanel.elementalDmg, 73);
});

test("applies Hu Tao panel passives from the character preset", () => {
  const hutaoBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: hutao,
    weapon: homa,
    weaponPassiveSelections: { homaHpState: "below50" },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const result = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        hutaoHpState: "below50",
      },
    },
  });

  assert.equal(result.staticPanel.elementalDmg, 0);
  assert.equal(result.combatPanel.elementalDmg, 33);
  assert.ok(result.combatPanel.atk > result.staticPanel.atk);
  assert.ok(
    result.skills[0].description.includes(
      result.combatPanel.atk.toLocaleString("zh-CN"),
    ),
  );
});

test("runs additive weapon effects before character conversions", () => {
  const raidenBuild: BuildInput = {
    ...build,
    element: "electro",
    character: raiden,
    weapon: engulfing,
    weaponPassiveSelections: { engulfingBurst: "active" },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const result = calculateResolvedBuild({
    build: raidenBuild,
    character: raiden,
    weapon: engulfing,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
  });

  assert.equal(result.staticPanel.energyRecharge, 187.1);
  assert.equal(result.combatPanel.energyRecharge, 217.1);
  assert.equal(result.staticPanel.elementalDmg, 34.8);
  assert.equal(result.combatPanel.elementalDmg, 46.8);
  assert.ok(result.combatPanel.atk > result.staticPanel.atk);
});

test("uses the resolved catalog character when request fields disagree", () => {
  const mismatchedBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: {
      ...build.character,
      baseAtk: 1,
    },
  };
  const result = calculateBuild({
    build: mismatchedBuild,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const expected = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
  });

  assert.deepEqual(result.panel, expected.panel);
  assert.equal(
    result.warnings[0]?.code,
    "CHARACTER_BUILD_NORMALIZED",
  );
});

test("excludes incompatible Blizzard crit rate from Hu Tao Melt expectation", () => {
  const hutaoBuild: BuildInput = {
    ...build,
    element: "pyro",
    character: hutao,
    weapon: homa,
    weaponPassiveSelections: { homaHpState: "below50" },
  };
  const result = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("blizzard-strayer"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        hutaoHpState: "below50",
      },
    },
  });
  const skill = result.skills.find(
    (item) => item.id === "hutao-charged",
  );
  const plain = skill?.variants.find((variant) => variant.reaction === "none");
  const melt = skill?.variants.find((variant) => variant.reaction === "melt");

  assert.ok(plain);
  assert.ok(melt);
  assert.equal(
    result.warnings[0]?.code,
    "INCOMPATIBLE_BLIZZARD_MELT_CONDITION",
  );
  const critFactor = result.panel.critDmg / 100;
  assert.ok(
    Math.abs(
      plain.expected / plain.nonCrit -
        (1 + (result.panel.critRate / 100) * critFactor),
    ) < 0.002,
  );
  assert.ok(
    Math.abs(melt.expected / melt.nonCrit - (1 + 0.05 * critFactor)) <
      0.002,
  );
});

test("applies every The Catch refinement to burst damage and CRIT rate", () => {
  const catchBuild: BuildInput = {
    ...build,
    element: "electro",
    character: raiden,
    weapon: theCatch,
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
  };
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      raidenEyeState: "inactive",
      raidenResolveStacks: "0",
    },
  };
  const calculateAtRefinement = (refinement: number) =>
    calculateResolvedBuild({
      build: {
        ...catchBuild,
        weapon: { ...theCatch, refinement },
      },
      character: raiden,
      weapon: theCatch,
      artifactSet: getArtifactSet("none"),
      settings,
    }).skills[0].variants[0];
  const variants = [1, 2, 3, 4, 5].map(calculateAtRefinement);
  const burstDamageBonuses = [16, 20, 24, 28, 32];
  const burstCritRates = [6, 7.5, 9, 10.5, 12];

  variants.forEach((variant, index) => {
    const expectedCritFactor =
      1 + ((5 + burstCritRates[index]) / 100) * 0.5;
    const expectedDamageRatio =
      (1.312 + burstDamageBonuses[index] / 100) /
      (1.312 + burstDamageBonuses[0] / 100);

    assert.ok(
      Math.abs(
        variant.expected / variant.nonCrit -
          expectedCritFactor,
      ) < 0.002,
    );
    assert.ok(
      Math.abs(
        variant.nonCrit / variants[0].nonCrit -
          expectedDamageRatio,
      ) < 0.002,
    );
  });
});

test("exports panel and damage from the same recalculation", () => {
  const changedBuild = {
    ...build,
    artifact: {
      ...build.artifact,
      flatAtk: build.artifact.flatAtk + 321,
    },
  };
  const result = calculateBuild({
    build: changedBuild,
    character: ayaka,
    settings: defaultDamageSettings,
  });
  const payload = createResultPayload({
    artifactSetName: "无",
    build: changedBuild,
    elementLabel: "冰元素",
    result,
    settings: defaultDamageSettings,
  });
  const shareText = createShareText(changedBuild, result);

  assert.equal(payload.攻击力, result.panel.atk);
  assert.deepEqual(
    payload.代表技能伤害,
    Object.fromEntries(
      result.skills.map((skill) => [
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
  );
  assert.ok(
    shareText.includes(result.panel.atk.toLocaleString("zh-CN")),
  );
});

test("applies selected constellation damage and talent effects", () => {
  const c0 = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
    constellation: 0,
  });
  const c2 = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
    constellation: 2,
  });
  const c3 = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
    constellation: 3,
  });
  const c4 = calculateBuild({
    build,
    character: ayaka,
    settings: defaultDamageSettings,
    constellation: 4,
  });
  const c0Burst = c0.skills.find(
    (skill) => skill.id === "ayaka-burst",
  )?.variants[0];
  const c2Burst = c2.skills.find(
    (skill) => skill.id === "ayaka-burst",
  )?.variants[0];

  assert.ok(c0Burst);
  assert.ok(c2Burst);
  assert.ok(
    Math.abs(c2Burst.nonCrit / c0Burst.nonCrit - 1.4) < 0.001,
  );
  assert.equal(c3.effectiveSettings.burstTalentLevel, 13);
  assert.ok(c4.defenseMultiplier > c3.defenseMultiplier);
  assert.equal(
    c4.teamBuffs.find(
      (buff) => buff.id === "self:character:ayaka-c4-defense-down",
    )?.enabled,
    true,
  );
});

test("uses constellation talent levels in character panel conversions", () => {
  const hutaoBuild = buildFor(hutao, homa);
  const settings = {
    ...defaultDamageSettings,
    selections: {
      ...defaultDamageSettings.selections,
      hutaoHpState: "below50",
    },
  };
  const c2 = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings,
    constellation: 2,
  });
  const c3 = calculateResolvedBuild({
    build: hutaoBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings,
    constellation: 3,
  });

  assert.equal(c3.effectiveSettings.skillTalentLevel, 13);
  assert.ok(c3.panel.atk > c2.panel.atk);
});

test("applies Raiden C2 defense ignore and C3 burst level", () => {
  const raidenBuild = buildFor(raiden, engulfing);
  const c0 = calculateResolvedBuild({
    build: raidenBuild,
    character: raiden,
    weapon: engulfing,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
  });
  const c3 = calculateResolvedBuild({
    build: raidenBuild,
    character: raiden,
    weapon: engulfing,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    constellation: 3,
  });

  assert.ok(c3.defenseMultiplier > c0.defenseMultiplier);
  assert.equal(c3.effectiveSettings.burstTalentLevel, 13);
});

test("resolves teammate character and weapon buffs from the selected plan", () => {
  const nahidaPlan = createTeammatePlan({
    character: nahida,
    weapon: dreams,
  });
  const targetBuild = buildFor(ayaka, mistsplitter);
  const enabled = calculateResolvedBuild({
    build: targetBuild,
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(nahidaPlan),
  });
  const dreamsBuffId =
    "slot:0:weapon:dreams-party-elemental-mastery";
  const disabled = calculateResolvedBuild({
    build: targetBuild,
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(nahidaPlan, {
      [dreamsBuffId]: false,
    }),
  });

  assert.equal(
    enabled.panel.elementalMastery -
      disabled.panel.elementalMastery,
    40,
  );
  assert.equal(
    disabled.teamBuffs.find((buff) => buff.id === dreamsBuffId)
      ?.enabled,
    false,
  );
  assert.ok(
    enabled.teamBuffs.some(
      (buff) =>
        buff.id ===
        "slot:0:character:nahida-compassion-illuminated",
    ),
  );
});

test("applies teammate skill buffs only to matching damage categories", () => {
  const raidenPlan = createTeammatePlan({
    character: raiden,
    weapon: favoniusLance,
  });
  const targetBuild = buildFor(ayaka, mistsplitter);
  const withoutTeam = calculateResolvedBuild({
    build: targetBuild,
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
  });
  const withTeam = calculateResolvedBuild({
    build: targetBuild,
    character: ayaka,
    weapon: mistsplitter,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(raidenPlan),
  });
  const plainSkill = withoutTeam.skills.find(
    (skill) => skill.id === "ayaka-skill",
  )?.variants[0];
  const buffedSkill = withTeam.skills.find(
    (skill) => skill.id === "ayaka-skill",
  )?.variants[0];
  const plainBurst = withoutTeam.skills.find(
    (skill) => skill.id === "ayaka-burst",
  )?.variants[0];
  const buffedBurst = withTeam.skills.find(
    (skill) => skill.id === "ayaka-burst",
  )?.variants[0];

  assert.equal(buffedSkill?.nonCrit, plainSkill?.nonCrit);
  assert.ok((buffedBurst?.nonCrit ?? 0) > (plainBurst?.nonCrit ?? 0));
  assert.equal(
    withTeam.teamBuffs.some((buff) => buff.sourceKind === "weapon"),
    false,
  );
});

test("applies teammate Deepwood and does not stack duplicate reductions", () => {
  const deepwoodPlan = createTeammatePlan({
    character: ayaka,
    weapon: mistsplitter,
    artifactSetId: "deepwood",
    artifactSetPieces: 4,
  });
  const targetBuild = buildFor(nahida, dreams);
  const teammateDeepwood = calculateResolvedBuild({
    build: targetBuild,
    character: nahida,
    weapon: dreams,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(deepwoodPlan),
  });
  const ownAndTeammateDeepwood = calculateResolvedBuild({
    build: {
      ...targetBuild,
      artifactSetId: "deepwood",
      artifactSetPieces: 4,
    },
    character: nahida,
    weapon: dreams,
    artifactSet: getArtifactSet("deepwood"),
    settings: defaultDamageSettings,
    team: teamWithPlan(deepwoodPlan),
  });

  assert.equal(teammateDeepwood.effectiveResistance, -20);
  assert.equal(ownAndTeammateDeepwood.effectiveResistance, -20);
  assert.equal(
    ownAndTeammateDeepwood.teamBuffs.some(
      (buff) => buff.sourceKind === "artifact",
    ),
    false,
  );
});

test("derives elemental resonance from the configured party", () => {
  const customPyroPlan = createTeammatePlan({
    character: customCharacter,
    weapon: customWeapon,
    element: "pyro",
  });
  const targetBuild = buildFor(hutao, homa);
  const resonanceId = "resonance:fervent-flames-attack";
  const enabled = calculateResolvedBuild({
    build: targetBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(customPyroPlan),
  });
  const disabled = calculateResolvedBuild({
    build: targetBuild,
    character: hutao,
    weapon: homa,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: teamWithPlan(customPyroPlan, {
      [resonanceId]: false,
    }),
  });

  assert.ok(enabled.panel.atk > disabled.panel.atk);
  assert.equal(
    enabled.teamBuffs.find((buff) => buff.id === resonanceId)
      ?.sourceKind,
    "resonance",
  );
  assert.equal(
    disabled.teamBuffs.find((buff) => buff.id === resonanceId)
      ?.enabled,
    false,
  );
});
