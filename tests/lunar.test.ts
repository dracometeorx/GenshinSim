import assert from "node:assert/strict";
import test from "node:test";

import { calculateBuild } from "../lib/calculation.ts";
import {
  createBuildPlan,
  createBuildPlanSnapshot,
} from "../lib/build-plans.ts";
import type {
  BuildInput,
  FinalPanel,
} from "../lib/calculator.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import {
  getArtifactModifiers,
  getArtifactSet,
} from "../lib/data/artifacts/index.ts";
import {
  characters,
  type CharacterPreset,
} from "../lib/data/characters/index.ts";
import { ayaka } from "../lib/data/characters/ayaka.ts";
import { flins } from "../lib/data/characters/flins.ts";
import { ineffa } from "../lib/data/characters/ineffa.ts";
import {
  weapons,
  type WeaponPreset,
} from "../lib/data/weapons/index.ts";
import {
  evaluateDamageEffects,
  evaluatePanelEffects,
} from "../lib/effects.ts";
import {
  createTeamCalculationInput,
  deriveMoonsignState,
} from "../lib/team.ts";
import { createEmptyTeamConfiguration } from "../lib/team-types.ts";

const artifact: BuildInput["artifact"] = {
  flatHp: 0,
  flatAtk: 0,
  flatDef: 0,
  critRate: 0,
  critDmg: 0,
  energyRecharge: 0,
  elementalMastery: 0,
  elementalDmg: 0,
  healingBonus: 0,
};

const talentBonuses = {
  skill: 0,
  burst: 0,
  normal: 0,
  charged: 0,
  plunge: 0,
};

const lunarCharacterIds = [
  "columbina",
  "flins",
  "ineffa",
  "lauma",
  "nefer",
  "linnea",
  "zibai",
] as const;

function calculateCharacter(character: CharacterPreset) {
  const weapon = weapons.find(
    (item) => item.id === character.defaultWeaponId,
  );
  assert.ok(weapon);
  const build: BuildInput = {
    element: character.element,
    character,
    weapon,
    weaponPassiveSelections: weapon.passive.control
      ? {
          [weapon.passive.control.key]:
            weapon.passive.control.defaultValue,
        }
      : {},
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
    artifact,
    talentBonuses,
  };
  return calculateBuild({
    build,
    character,
    weapon,
    artifactSet: getArtifactSet("none"),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        ...Object.fromEntries(
          (character.damageProfile?.controls ?? []).map((control) => [
            control.key,
            control.defaultValue,
          ]),
        ),
      },
    },
  });
}

test("exports every requested Lunar character with direct Lunar damage", () => {
  for (const id of lunarCharacterIds) {
    const character = characters.find((item) => item.id === id);
    assert.ok(character, id);
    assert.equal(character.moonsign, true, id);
    assert.ok(character.defaultWeaponId, id);

    const result = calculateCharacter(character);
    assert.equal(result.moonsign.level, "nascent", id);
    assert.ok(result.skills.length > 0, id);
    assert.ok(
      result.skills.every(
        (skill) =>
          skill.model === "directLunar" &&
          skill.variants.every(
            (variant) =>
              variant.model === "directLunar" &&
              variant.defenseMultiplier === 1,
          ),
      ),
      id,
    );
    assert.ok(
      result.warnings.some(
        (warning) =>
          warning.code === "LUNAR_TRANSFORMATIVE_DAMAGE_EXCLUDED",
      ),
      id,
    );
  }
});

test("derives nascent and ascendant Moonsign from party characters", () => {
  assert.deepEqual(deriveMoonsignState(flins, []), {
    count: 1,
    level: "nascent",
  });
  assert.deepEqual(
    deriveMoonsignState(flins, [{ character: ineffa }]),
    {
      count: 2,
      level: "ascendant",
    },
  );
});

test("keeps Columbina C2 HP and elevation intrinsic while the on-field buff stays toggleable", () => {
  const columbina = characters.find(
    (character) => character.id === "columbina",
  );
  const columbinaWeapon = weapons.find(
    (weapon) => weapon.id === columbina?.defaultWeaponId,
  );
  const ineffaWeapon = weapons.find(
    (weapon) => weapon.id === ineffa.defaultWeaponId,
  );
  assert.ok(columbina);
  assert.ok(columbinaWeapon);
  assert.ok(ineffaWeapon);

  const columbinaBuild: BuildInput = {
    element: columbina.element,
    character: columbina,
    weapon: columbinaWeapon,
    weaponPassiveSelections: {
      nocturnesCurtainCallState: "inactive",
    },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
    artifact,
    talentBonuses,
  };
  const ineffaBuild: BuildInput = {
    ...columbinaBuild,
    element: ineffa.element,
    character: ineffa,
    weapon: ineffaWeapon,
    weaponPassiveSelections: {
      fracturedHaloState: "inactive",
    },
  };
  const ineffaPlan = createBuildPlan(
    createBuildPlanSnapshot({
      build: ineffaBuild,
      characterId: ineffa.id,
      weaponId: ineffaWeapon.id,
      damageSettings: defaultDamageSettings,
    }),
    "伊涅芙月兆队友",
    { id: "ineffa-columbina-c2-test" },
  );
  const createConfiguration = (frontBuffEnabled: boolean) => {
    const configuration = createEmptyTeamConfiguration();
    configuration.slots[0] = {
      characterId: ineffa.id,
      planId: ineffaPlan.id,
    };
    configuration.buffToggles = {
      "self:character:columbina-constellation-elevation": false,
      "self:character:columbina-c2-radiance": frontBuffEnabled,
    };
    return configuration;
  };
  const calculate = (
    constellation: number,
    frontBuffEnabled: boolean,
  ) => {
    const configuration = createConfiguration(frontBuffEnabled);
    return calculateBuild({
      build: columbinaBuild,
      character: columbina,
      weapon: columbinaWeapon,
      artifactSet: getArtifactSet("none"),
      settings: {
        ...defaultDamageSettings,
        selections: { columbinaInterference: "lunarCharged" },
      },
      constellation,
      team: createTeamCalculationInput(configuration, [ineffaPlan]),
    });
  };

  const c0 = calculate(0, false);
  const c2Disabled = calculate(2, false);
  const c2Enabled = calculate(2, true);
  assert.equal(c2Disabled.panel.hp - c0.panel.hp, 14695 * 0.4);
  assert.deepEqual(c2Disabled.damageBonusSummary.lunarElevations, {
    lunarCharged: 8.5,
    lunarBloom: 8.5,
    lunarCrystallize: 8.5,
  });

  const elevation = c2Disabled.teamBuffs.find(
    ({ id }) =>
      id === "self:character:columbina-constellation-elevation",
  );
  const disabledFrontBuff = c2Disabled.teamBuffs.find(
    ({ id }) => id === "self:character:columbina-c2-radiance",
  );
  assert.ok(elevation);
  assert.equal(elevation.toggleable, false);
  assert.equal(elevation.enabled, true);
  assert.ok(disabledFrontBuff);
  assert.equal(disabledFrontBuff.toggleable, true);
  assert.equal(disabledFrontBuff.enabled, false);
  assert.ok(c2Enabled.panel.atk > c2Disabled.panel.atk);
});

test("applies teammate Lunar buffs and full-Moonsign character passives", () => {
  const targetWeapon = weapons.find(
    (weapon) => weapon.id === flins.defaultWeaponId,
  );
  const teammateWeapon = weapons.find(
    (weapon) => weapon.id === ineffa.defaultWeaponId,
  );
  assert.ok(targetWeapon);
  assert.ok(teammateWeapon);
  const targetBuild: BuildInput = {
    element: flins.element,
    character: flins,
    weapon: targetWeapon,
    weaponPassiveSelections: {
      bloodsoakedRuinsState: "inactive",
    },
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
    artifact,
    talentBonuses,
  };
  const teammateBuild: BuildInput = {
    ...targetBuild,
    element: ineffa.element,
    character: ineffa,
    weapon: teammateWeapon,
    weaponPassiveSelections: {
      fracturedHaloState: "active",
    },
  };
  const ayakaWeapon = weapons.find(
    (weapon) => weapon.id === ayaka.defaultWeaponId,
  );
  assert.ok(ayakaWeapon);
  const ayakaBuild: BuildInput = {
    ...targetBuild,
    element: ayaka.element,
    character: ayaka,
    weapon: ayakaWeapon,
    weaponPassiveSelections: ayakaWeapon.passive.control
      ? {
          [ayakaWeapon.passive.control.key]:
            ayakaWeapon.passive.control.defaultValue,
        }
      : {},
  };
  const teammatePlan = createBuildPlan(
    createBuildPlanSnapshot({
      build: teammateBuild,
      characterId: ineffa.id,
      weaponId: teammateWeapon.id,
      damageSettings: defaultDamageSettings,
    }),
    "伊涅芙队友",
    { id: "ineffa-lunar-team-plan" },
  );
  const configuration = createEmptyTeamConfiguration();
  configuration.slots[0] = {
    characterId: ineffa.id,
    planId: teammatePlan.id,
  };
  const ayakaPlan = createBuildPlan(
    createBuildPlanSnapshot({
      build: ayakaBuild,
      characterId: ayaka.id,
      weaponId: ayakaWeapon.id,
      damageSettings: defaultDamageSettings,
    }),
    "神里绫华队友",
    { id: "ayaka-lunar-team-plan" },
  );
  configuration.slots[1] = {
    characterId: ayaka.id,
    planId: ayakaPlan.id,
  };
  const withoutTeam = calculateBuild({
    build: targetBuild,
    character: flins,
    weapon: targetWeapon,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
  });
  const withTeam = calculateBuild({
    build: targetBuild,
    character: flins,
    weapon: targetWeapon,
    artifactSet: getArtifactSet("none"),
    settings: defaultDamageSettings,
    team: createTeamCalculationInput(configuration, [
      teammatePlan,
      ayakaPlan,
    ]),
  });

  assert.equal(withTeam.moonsign.level, "ascendant");
  assert.equal(
    withTeam.selectedSkill?.name,
    "雷霆交响·两段合计",
  );
  assert.match(
    withTeam.selectedSkill?.multiplierLabel ?? "",
    /\+.*攻击力/,
  );
  assert.equal(withTeam.selectedSkill?.segments?.length, 2);
  assert.equal(
    withTeam.selectedSkill?.segments?.reduce(
      (sum, segment) => sum + segment.variants[0].expected,
      0,
    ),
    withTeam.selectedSkill?.variants[0].expected,
  );
  assert.ok(
    (withTeam.selectedSkill?.variants[0].expected ?? 0) >
      (withoutTeam.selectedSkill?.variants[0].expected ?? 0) * 2,
  );
  assert.ok(
    withTeam.teamBuffs.some(
      (buff) =>
        buff.sourceName === "伊涅芙" &&
        buff.name === "月兆祝赐·象拟中继",
    ),
  );
  assert.ok(
    withTeam.teamBuffs.some(
      (buff) =>
        buff.sourceName === "神里绫华" &&
        buff.name === "月兆·满辉队伍增益",
    ),
  );
  assert.ok(
    withTeam.teamBuffs.some(
      (buff) =>
        buff.sourceName === "支离轮光" &&
        buff.name === "雷霆敕令",
    ),
  );
  assert.ok(
    withTeam.skills[0].variants[0].expected >
      withoutTeam.skills[0].variants[0].expected,
  );
});

test("applies all-party signature buffs to the weapon wielder", () => {
  const ineffaResult = calculateCharacter(ineffa);
  const laumaCharacter = characters.find(
    (character) => character.id === "lauma",
  );
  assert.ok(laumaCharacter);
  const laumaResult = calculateCharacter(laumaCharacter);

  assert.ok(
    ineffaResult.teamBuffs.some(
      (buff) =>
        buff.sourceName === "支离轮光" &&
        buff.name === "雷霆敕令",
    ),
  );
  assert.ok(
    laumaResult.teamBuffs.some(
      (buff) =>
        buff.sourceName === "纺夜天镜" &&
        buff.name === "朔月诗篇",
    ),
  );
});

test("scales all Lunar artifact sets with Moonsign and active state", () => {
  const silkenNascent = getArtifactModifiers(
    "silken-moons-serenade",
    4,
    {},
    { moonsignLevel: "nascent" },
  );
  const silkenAscendant = getArtifactModifiers(
    "silken-moons-serenade",
    4,
    {},
    { moonsignLevel: "ascendant" },
  );
  assert.equal(
    silkenNascent.find(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "elementalMastery",
    )?.value,
    60,
  );
  assert.equal(
    silkenAscendant.find(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "elementalMastery",
    )?.value,
    120,
  );

  const skyNascent = getArtifactModifiers(
    "night-of-skys-unveiling",
    4,
    { nightOfSkyState: "active" },
    { moonsignLevel: "nascent" },
  );
  const skyAscendant = getArtifactModifiers(
    "night-of-skys-unveiling",
    4,
    { nightOfSkyState: "active" },
    { moonsignLevel: "ascendant" },
  );
  assert.equal(
    skyNascent.find(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "critRate",
    )?.value,
    15,
  );
  assert.equal(
    skyAscendant.find(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "critRate",
    )?.value,
    30,
  );

  const aubade = getArtifactModifiers(
    "aubade-of-morningstar-and-moon",
    4,
    { aubadeState: "active" },
    { moonsignLevel: "ascendant" },
  );
  assert.equal(
    aubade.find(
      (modifier) => modifier.kind === "lunarDamageBonus",
    )?.value,
    60,
  );
  assert.equal(
    aubade.some(
      (modifier) => modifier.kind === "damageBonus",
    ),
    false,
  );
});

const signatureExpectations = [
  {
    id: "fractured-halo",
    panel: [24, 30, 36, 42, 48],
    damage: [0, 0, 0, 0, 0],
    team: [40, 50, 60, 70, 80],
  },
  {
    id: "bloodsoaked-ruins",
    panel: [0, 0, 0, 0, 0],
    damage: [36, 48, 60, 72, 84],
    team: [0, 0, 0, 0, 0],
  },
  {
    id: "nightweavers-looking-glass",
    panel: [120, 150, 180, 210, 240],
    damage: [0, 0, 0, 0, 0],
    team: [40, 50, 60, 70, 80],
  },
  {
    id: "reliquary-of-truth",
    panel: [128, 160, 192, 224, 256],
    damage: [0, 0, 0, 0, 0],
    team: [0, 0, 0, 0, 0],
  },
  {
    id: "nocturnes-curtain-call",
    panel: [24, 28, 32, 36, 40],
    damage: [0, 0, 0, 0, 0],
    team: [0, 0, 0, 0, 0],
  },
  {
    id: "lightbearing-moonshard",
    panel: [20, 25, 30, 35, 40],
    damage: [64, 80, 96, 112, 128],
    team: [0, 0, 0, 0, 0],
  },
  {
    id: "frostbound-oath",
    panel: [16, 20, 24, 28, 32],
    damage: [40, 50, 60, 70, 80],
    team: [20, 25, 30, 35, 40],
  },
] as const;

const effectPanel: FinalPanel = {
  hp: 20000,
  atk: 2000,
  def: 1000,
  critRate: 5,
  critDmg: 50,
  energyRecharge: 100,
  elementalMastery: 0,
  elementalDmg: 0,
  healingBonus: 0,
  talentBonuses,
};

function effectBuild(weapon: WeaponPreset, refinement: number): BuildInput {
  const control = weapon.passive.control;
  return {
    element: "geo",
    character: {
      name: "测试角色",
      level: 90,
      baseHp: 10000,
      baseAtk: 100,
      baseDef: 100,
      ascensionStat: "none",
      ascensionValue: 0,
    },
    weapon: { ...weapon, refinement },
    weaponPassiveSelections: control
      ? { [control.key]: control.defaultValue }
      : {},
    artifact,
    talentBonuses,
  };
}

test("evaluates all seven signature weapons from refinement 1 through 5", () => {
  for (const expectation of signatureExpectations) {
    const weapon = weapons.find((item) => item.id === expectation.id);
    assert.ok(weapon);
    for (let refinement = 1; refinement <= 5; refinement += 1) {
      const build = effectBuild(weapon, refinement);
      const panelValue = evaluatePanelEffects(
        weapon.passive.panelEffects ?? [],
        "additive",
        true,
        {
          build,
          baseHp: 10000,
          baseAtk: 100,
          baseDef: 100,
          panel: effectPanel,
          refinementIndex: refinement - 1,
          weaponSelections: build.weaponPassiveSelections ?? {},
          damageSelections: {},
          damageSettings: defaultDamageSettings,
        },
      ).reduce((total, modifier) => total + modifier.value, 0);
      const damageValue = evaluateDamageEffects(
        weapon.passive.damageEffects ?? [],
        {
          build,
          panel: effectPanel,
          target: {
            id: "test",
            name: "测试月结晶",
            description: "测试",
            multiplierLabel: "100%",
            baseDamage: 1000,
            category: "skill",
            reactions: [],
            model: {
              kind: "directLunar",
              reaction:
                expectation.id === "bloodsoaked-ruins"
                  ? "lunarCharged"
                  : "lunarCrystallize",
            },
          },
          settings: defaultDamageSettings,
          refinementIndex: refinement - 1,
          weaponSelections: build.weaponPassiveSelections ?? {},
        },
      )
        .filter(
          (modifier) =>
            modifier.stat === "lunarReactionDamageBonus",
        )
        .reduce((total, modifier) => total + modifier.value, 0);
      const teamValue = (weapon.passive.teamBuffs ?? [])
        .flatMap((definition) =>
          definition.evaluate({
            source: {
              characterId: "test-source",
              moonsign: true,
              hexerei: false,
              constellation: 0,
              element: "geo",
              panel: effectPanel,
              settings: defaultDamageSettings,
              weaponRefinement: refinement,
              weaponSelections:
                build.weaponPassiveSelections ?? {},
              artifactSelections: {},
            },
            target: {
              characterId: "test-target",
              element: "geo",
              burstEnergyCost: 60,
              moonsign: true,
              hexerei: false,
            },
            party: {
              highestElementalMastery: 0,
              elements: ["geo"],
              moonsignCount: 2,
              moonsignLevel: "ascendant",
              hexereiCount: 0,
              hexereiSecretRite: false,
            },
          }),
        )
        .filter(
          (modifier) =>
            modifier.kind === "damage" &&
            modifier.stat === "lunarReactionDamageBonus",
        )
        .reduce((total, modifier) => total + modifier.value, 0);

      assert.equal(
        panelValue,
        expectation.panel[refinement - 1],
        `${expectation.id} R${refinement} panel`,
      );
      assert.equal(
        damageValue,
        expectation.damage[refinement - 1],
        `${expectation.id} R${refinement} damage`,
      );
      assert.equal(
        teamValue,
        expectation.team[refinement - 1],
        `${expectation.id} R${refinement} team`,
      );
    }
  }
});
