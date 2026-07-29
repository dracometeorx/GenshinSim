import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFinalPanel,
  type BuildInput,
  type FinalPanel,
} from "../lib/calculator.ts";
import {
  calculateRepresentativeDamage,
  defaultDamageSettings,
} from "../lib/damage.ts";
import type { CharacterPreset } from "../lib/data/characters/types.ts";
import { weapons } from "../lib/data/weapons/index.ts";
import type { WeaponPreset } from "../lib/data/weapons/types.ts";
import {
  evaluateDamageEffects,
  type DamageEffectModifier,
} from "../lib/effects.ts";
import type { TeamBuffEvaluationContext } from "../lib/team-types.ts";

const requestedWeapons = [
  ["ballad-of-the-fjords", "峡湾长歌", "polearm", 510, "critRate", 27.6],
  ["tamayuratei-no-ohanashi", "且住亭御咄", "polearm", 565, "energyRecharge", 30.6],
  ["prospectors-shovel", "掘金之锹", "polearm", 510, "atkPct", 41.3],
  ["calamity-queller", "息灾", "polearm", 741, "atkPct", 16.5],
  ["missive-windspear", "风信之锋", "polearm", 510, "atkPct", 41.3],
  ["lost-prayer", "四风原典", "catalyst", 608, "critRate", 33.1],
  ["dawning-frost", "霜辰", "catalyst", 510, "critDmg", 55.1],
  ["etherlight-spindlelute", "天光的纺琴", "catalyst", 510, "energyRecharge", 45.9],
  ["wandering-evenstar", "流浪的晚星", "catalyst", 510, "elementalMastery", 165],
  ["sacrificial-jade", "遗祀玉珑", "catalyst", 454, "critRate", 36.8],
  ["oathsworn-eye", "证誓之明瞳", "catalyst", 565, "atkPct", 27.6],
  ["sacrificial-fragments", "祭礼残章", "catalyst", 454, "elementalMastery", 221],
  ["the-widsith", "流浪乐章", "catalyst", 510, "critDmg", 55.1],
  ["solar-pearl", "匣里日月", "catalyst", 510, "critRate", 27.6],
  ["prototype-amber", "试作金珀", "catalyst", 510, "hpPct", 41.3],
  ["thrilling-tales", "讨龙英杰谭", "catalyst", 401, "hpPct", 35.2],
  ["azurelight", "苍耀", "sword", 674, "critRate", 22.1],
  ["splendor-of-tranquil-waters", "静水流涌之辉", "sword", 542, "critDmg", 88.2],
  ["skyward-blade", "天空之刃", "sword", 608, "energyRecharge", 55.1],
  ["wolf-fang", "狼牙", "sword", 510, "critRate", 27.6],
  ["the-black-sword", "黑剑", "sword", 510, "critRate", 27.6],
  ["the-dockhands-assistant", "船坞长剑", "sword", 510, "hpPct", 41.3],
  ["xiphos-moonlight", "西福斯的月光", "sword", 510, "elementalMastery", 165],
  ["calamity-of-eshu", "厄水之祸", "sword", 565, "atkPct", 27.6],
  ["favonius-sword", "西风剑", "sword", 454, "energyRecharge", 61.3],
  ["cinnabar-spindle", "辰砂之纺锤", "sword", 454, "defPct", 69],
  ["slingshot", "弹弓", "bow", 354, "critRate", 31.2],
  ["favonius-warbow", "西风猎弓", "bow", 454, "energyRecharge", 61.3],
  ["skyward-harp", "天空之翼", "bow", 674, "critRate", 22.1],
  ["the-first-great-magic", "最初的大魔术", "bow", 608, "critDmg", 66.2],
  ["amos-bow", "阿莫斯之弓", "bow", 608, "atkPct", 49.6],
  ["the-stringless", "绝弦", "bow", 510, "elementalMastery", 165],
  ["rust", "弓藏", "bow", 510, "atkPct", 41.3],
  ["the-viridescent-hunt", "苍翠猎弓", "bow", 510, "critRate", 27.6],
  ["wolfs-gravestone", "狼的末路", "claymore", 608, "atkPct", 49.6],
  ["skyward-pride", "天空之傲", "claymore", 674, "energyRecharge", 36.8],
  ["ultimate-overlords-mega-magic-sword", "「究极霸王超级魔剑」", "claymore", 565, "energyRecharge", 30.6],
  ["makhaira-aquamarine", "玛海菈的水色", "claymore", 510, "elementalMastery", 165],
  ["talking-stick", "聊聊棒", "claymore", 565, "critRate", 18.4],
  ["tidal-shadow", "浪影阔剑", "claymore", 510, "atkPct", 41.3],
  ["serpent-spine", "螭骨剑", "claymore", 510, "critRate", 27.6],
] as const;

const emptyArtifact: BuildInput["artifact"] = {
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

const talentBonuses: BuildInput["talentBonuses"] = {
  skill: 0,
  burst: 0,
  normal: 0,
  charged: 0,
  plunge: 0,
};

const testCharacter: CharacterPreset = {
  id: "weapon-test-character",
  name: "武器测试角色",
  level: 90,
  baseHp: 10000,
  baseAtk: 300,
  baseDef: 800,
  ascensionStat: "none",
  ascensionValue: 0,
  ascensionLabel: "无突破属性",
  element: "pyro",
  weaponType: "any",
  defaultWeaponId: "custom",
  damageProfile: {
    kind: "weapon-test",
    talentLabel: "测试倍率",
    controls: [],
    evaluateTargets: () => [
      {
        id: "test-skill",
        name: "测试战技",
        description: "固定基础伤害",
        multiplierLabel: "1,000",
        baseDamage: 1000,
        category: "skill",
        reactions: ["none"],
      },
      {
        id: "test-charged",
        name: "测试重击",
        description: "固定基础伤害",
        multiplierLabel: "1,000",
        baseDamage: 1000,
        category: "charged",
        reactions: ["none"],
      },
    ],
  },
};

function getWeapon(id: string) {
  const weapon = weapons.find((item) => item.id === id);
  assert.ok(weapon, `missing weapon ${id}`);
  return weapon;
}

function buildFor(
  weapon: WeaponPreset,
  refinement: number,
  weaponPassiveSelections: Record<string, string> = {},
): BuildInput {
  return {
    element: testCharacter.element,
    character: testCharacter,
    weapon: { ...weapon, refinement },
    weaponPassiveSelections,
    artifactSetId: "none",
    artifactSetPieces: 0,
    artifactSetSelections: {},
    artifact: { ...emptyArtifact },
    talentBonuses: { ...talentBonuses },
  };
}

function panelFor(
  weapon: WeaponPreset,
  refinement: number,
  selections: Record<string, string> = {},
) {
  const build = buildFor(weapon, refinement, selections);
  return calculateFinalPanel(build, {
    panelEffects: weapon.passive.panelEffects,
    damageSettings: defaultDamageSettings,
    includeConditionalEffects: true,
  });
}

function damageModifiersFor(
  weapon: WeaponPreset,
  refinement: number,
  category: "skill" | "charged",
  selections: Record<string, string> = {},
) {
  const build = buildFor(weapon, refinement, selections);
  const panel = panelFor(weapon, refinement, selections);
  return evaluateDamageEffects(
    weapon.passive.damageEffects ?? [],
    {
      build,
      panel,
      target: {
        id: "target",
        name: "目标",
        description: "测试目标",
        multiplierLabel: "100%",
        baseDamage: 1000,
        category,
        reactions: ["none"],
      },
      settings: defaultDamageSettings,
      refinementIndex: refinement - 1,
      weaponSelections: selections,
    },
  );
}

function modifierValue(
  modifiers: readonly DamageEffectModifier[],
  stat: DamageEffectModifier["stat"],
) {
  return modifiers
    .filter((modifier) => modifier.stat === stat)
    .reduce((total, modifier) => total + modifier.value, 0);
}

test("exports all requested weapons with their level-90 catalog stats", () => {
  for (const [
    id,
    name,
    weaponType,
    baseAtk,
    secondaryStat,
    secondaryValue,
  ] of requestedWeapons) {
    const weapon = getWeapon(id);
    assert.deepEqual(
      {
        name: weapon.name,
        weaponType: weapon.weaponType,
        level: weapon.level,
        baseAtk: weapon.baseAtk,
        secondaryStat: weapon.secondaryStat,
        secondaryValue: weapon.secondaryValue,
      },
      {
        name,
        weaponType,
        level: 90,
        baseAtk,
        secondaryStat,
        secondaryValue,
      },
      id,
    );
    assert.equal(weapon.passive.refinementDescriptions?.length, 5);
    if (weapon.passive.control) {
      assert.ok(
        weapon.passive.control.options.some(
          ({ value }) => value === weapon.passive.control?.defaultValue,
        ),
        `${id} has an invalid default control value`,
      );
    }
  }
});

test("scales representative panel passives through refinement 1-5", () => {
  const dawningFrost = getWeapon("dawning-frost");
  const azurelight = getWeapon("azurelight");
  const calamityQueller = getWeapon("calamity-queller");

  assert.deepEqual(
    [1, 2, 3, 4, 5].map(
      (refinement) =>
        panelFor(dawningFrost, refinement, {
          dawningFrostState: "both",
        }).elementalMastery,
    ),
    [120, 150, 180, 210, 240],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(
      (refinement) =>
        panelFor(azurelight, refinement, {
          azurelightState: "zeroEnergy",
        }).atk,
    ),
    [1442, 1558, 1675, 1792, 1909],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(
      (refinement) =>
        panelFor(calamityQueller, refinement, {
          calamityQuellerState: "offField",
        }).atk,
    ),
    [1613, 1712, 1812, 1912, 2012],
  );
});

test("models crit, negative damage bonus, and additive base damage", () => {
  const azurelight = getWeapon("azurelight");
  const slingshot = getWeapon("slingshot");
  const rust = getWeapon("rust");
  const cinnabarSpindle = getWeapon("cinnabar-spindle");

  assert.deepEqual(
    [1, 2, 3, 4, 5].map((refinement) =>
      modifierValue(
        damageModifiersFor(
          azurelight,
          refinement,
          "skill",
          { azurelightState: "zeroEnergy" },
        ),
        "critDmg",
      ),
    ),
    [40, 50, 60, 70, 80],
  );
  assert.equal(
    modifierValue(
      damageModifiersFor(slingshot, 1, "charged", {
        slingshotState: "far",
      }),
      "damageBonus",
    ),
    -10,
  );
  assert.equal(
    modifierValue(
      damageModifiersFor(rust, 5, "charged"),
      "damageBonus",
    ),
    -10,
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((refinement) =>
      Math.round(
        modifierValue(
          damageModifiersFor(
            cinnabarSpindle,
            refinement,
            "skill",
          ),
          "additiveBaseDamage",
        ) * 10,
      ) / 10,
    ),
    [540.8, 676, 811.2, 946.4, 1081.6],
  );

  const baseBuild = buildFor(slingshot, 1, {
    slingshotState: "close",
  });
  const farBuild = buildFor(slingshot, 1, {
    slingshotState: "far",
  });
  const fixedPanel: FinalPanel = {
    hp: 10000,
    atk: 1000,
    def: 800,
    critRate: 0,
    critDmg: 50,
    energyRecharge: 100,
    elementalMastery: 0,
    elementalDmg: 0,
    healingBonus: 0,
    talentBonuses: { ...talentBonuses },
  };
  const baseDamage = calculateRepresentativeDamage(
    testCharacter,
    { ...baseBuild, weapon: { ...baseBuild.weapon, id: "custom" } },
    fixedPanel,
    defaultDamageSettings,
  );
  const farDamage = calculateRepresentativeDamage(
    testCharacter,
    farBuild,
    fixedPanel,
    defaultDamageSettings,
    [],
    slingshot.passive.damageEffects,
  );
  const baseCharged = baseDamage.skills.find(
    ({ id }) => id === "test-charged",
  );
  const farCharged = farDamage.skills.find(
    ({ id }) => id === "test-charged",
  );
  assert.ok(baseCharged);
  assert.ok(farCharged);
  assert.ok(
    Math.abs(
      farCharged.variants[0].nonCrit /
        baseCharged.variants[0].nonCrit -
        0.9,
    ) < 0.001,
  );
});

test("exposes target-only team buffs without applying them to teammates", () => {
  const sourcePanel: FinalPanel = {
    hp: 10000,
    atk: 1000,
    def: 800,
    critRate: 5,
    critDmg: 50,
    energyRecharge: 100,
    elementalMastery: 1000,
    elementalDmg: 0,
    healingBonus: 0,
    talentBonuses: { ...talentBonuses },
  };
  const context = (
    weaponRefinement: number,
    weaponSelections: Record<string, string>,
  ): TeamBuffEvaluationContext => ({
    source: {
      characterId: "source",
      moonsign: false,
      hexerei: false,
      constellation: 0,
      element: "pyro",
      panel: sourcePanel,
      settings: defaultDamageSettings,
      weaponRefinement,
      weaponSelections,
      artifactSelections: {},
    },
    target: {
      characterId: "target",
      element: "hydro",
      burstEnergyCost: 60,
      moonsign: false,
      hexerei: false,
    },
    party: {
      highestElementalMastery: 1000,
      elements: ["pyro", "hydro", "cryo"],
      moonsignCount: 0,
      moonsignLevel: "none",
      hexereiCount: 0,
      hexereiSecretRite: false,
    },
  });

  const thrillingTales = getWeapon("thrilling-tales");
  const wanderingEvenstar = getWeapon("wandering-evenstar");
  const ballad = getWeapon("ballad-of-the-fjords");

  assert.deepEqual(
    [1, 2, 3, 4, 5].map((refinement) =>
      thrillingTales.passive.teamBuffs?.[0]
        .evaluate(
          context(refinement, {
            thrillingTalesState: "active",
          }),
        )
        .map(({ value }) => value),
    ),
    [[24], [30], [36], [42], [48]],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((refinement) =>
      wanderingEvenstar.passive.teamBuffs?.[0]
        .evaluate(context(refinement, {}))
        .map(({ value }) => value),
    ),
    [[72], [90], [108], [126], [144]],
  );
  assert.equal(
    ballad.passive.teamBuffs?.[0]
      .evaluate(context(1, {}))
      .at(0)?.value,
    120,
  );
  assert.equal(
    ballad.passive.teamBuffs?.[0].appliesToTeammates,
    false,
  );
});
