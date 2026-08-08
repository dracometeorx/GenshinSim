import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBuild,
  type CalculationRequest,
} from "../lib/calculation.ts";
import type { BuildInput } from "../lib/calculator.ts";
import {
  createBuildPlan,
  createBuildPlanSnapshot,
} from "../lib/build-plans.ts";
import {
  artifactSets,
  getArtifactSet,
} from "../lib/data/artifacts/index.ts";
import {
  characters,
  type CharacterPreset,
} from "../lib/data/characters/index.ts";
import {
  weapons,
} from "../lib/data/weapons/index.ts";
import type { WeaponPreset } from "../lib/data/weapons/types.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import {
  createTeamCalculationInput,
} from "../lib/team.ts";
import { createEmptyTeamConfiguration } from "../lib/team-types.ts";

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

function character(id: string): CharacterPreset {
  const preset = characters.find((item) => item.id === id);
  assert.ok(preset, `missing character ${id}`);
  return preset;
}

function weapon(id: string): WeaponPreset {
  const preset = weapons.find((item) => item.id === id);
  assert.ok(preset, `missing weapon ${id}`);
  return preset;
}

function buildFor(
  characterPreset: CharacterPreset,
  weaponPreset: WeaponPreset,
  options: {
    artifactSetId?: string;
    artifactSetPieces?: 0 | 2 | 4;
    artifactSetSelections?: Record<string, string>;
  } = {},
): BuildInput {
  return {
    element: characterPreset.element,
    character: characterPreset,
    weapon: weaponPreset,
    weaponPassiveSelections: {},
    artifactSetId: options.artifactSetId ?? "none",
    artifactSetPieces: options.artifactSetPieces ?? 0,
    artifactSetSelections: {
      ...(options.artifactSetSelections ?? {}),
    },
    artifact: { ...emptyArtifact },
    talentBonuses: {
      skill: 0,
      burst: 0,
      normal: 0,
      charged: 0,
      plunge: 0,
    },
  };
}

function teammatePlan({
  characterId,
  weaponId,
  constellation = 0,
  artifactSetId = "none",
  artifactSetPieces = 0,
  artifactSetSelections = {},
  damageSelections = {},
}: {
  characterId: string;
  weaponId: string;
  constellation?: number;
  artifactSetId?: string;
  artifactSetPieces?: 0 | 2 | 4;
  artifactSetSelections?: Record<string, string>;
  damageSelections?: Record<string, string>;
}) {
  const characterPreset = character(characterId);
  const weaponPreset = weapon(weaponId);
  const build = buildFor(characterPreset, weaponPreset, {
    artifactSetId,
    artifactSetPieces,
    artifactSetSelections,
  });
  return createBuildPlan(
    createBuildPlanSnapshot({
      build,
      characterId,
      weaponId,
      constellation,
      damageSettings: {
        ...defaultDamageSettings,
        selections: {
          ...defaultDamageSettings.selections,
          ...damageSelections,
        },
      },
    }),
    `${characterPreset.name}辅助方案`,
    { id: `${characterId}-${artifactSetId}-${constellation}` },
  );
}

function teamFor(plan: ReturnType<typeof teammatePlan>) {
  const configuration = createEmptyTeamConfiguration();
  configuration.slots[0] = {
    characterId: plan.snapshot.characterId,
    planId: plan.id,
  };
  return createTeamCalculationInput(configuration, [plan]);
}

function calculate(
  characterId: string,
  weaponId: string,
  options: {
    constellation?: number;
    artifactSetId?: string;
    artifactSetPieces?: 0 | 2 | 4;
    artifactSetSelections?: Record<string, string>;
    team?: CalculationRequest["team"];
    damageSelections?: Record<string, string>;
  } = {},
) {
  const characterPreset = character(characterId);
  const weaponPreset = weapon(weaponId);
  const build = buildFor(characterPreset, weaponPreset, options);
  return calculateBuild({
    build,
    character: characterPreset,
    weapon: weaponPreset,
    artifactSet: getArtifactSet(build.artifactSetId),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        ...options.damageSelections,
      },
    },
    constellation: options.constellation,
    team: options.team,
  });
}

test("adds complete combat presets for Xilonen, Citlali, Zhongli, and Furina", () => {
  assert.deepEqual(
    ["xilonen", "citlali", "zhongli", "furina"].map((id) => {
      const preset = character(id);
      return {
        id,
        level: preset.level,
        hasDamage: Boolean(preset.damageProfile),
        hasTeamBuff: Boolean(preset.teamBuffs?.length),
        constellationCount: preset.constellations?.length,
      };
    }),
    [
      {
        id: "xilonen",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
      {
        id: "citlali",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
      {
        id: "zhongli",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
      {
        id: "furina",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
    ],
  );
});

test("adds Bennett and Lan Yan with representative damage and full constellations", () => {
  assert.deepEqual(
    ["bennett", "lan-yan"].map((id) => {
      const preset = character(id);
      return {
        id,
        level: preset.level,
        hasDamage: Boolean(preset.damageProfile),
        hasTeamBuff: Boolean(preset.teamBuffs?.length),
        constellationCount: preset.constellations?.length,
      };
    }),
    [
      {
        id: "bennett",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
      {
        id: "lan-yan",
        level: 90,
        hasDamage: true,
        hasTeamBuff: true,
        constellationCount: 6,
      },
    ],
  );

  const bennett = calculate("bennett", "skyward-blade", {
    constellation: 5,
  });
  const lanYanC0 = calculate("lan-yan", "thrilling-tales", {
    constellation: 0,
  });
  const lanYanC1 = calculate("lan-yan", "thrilling-tales", {
    constellation: 1,
  });
  assert.equal(
    bennett.selectedSkill?.id,
    "bennett-fantastic-voyage",
  );
  assert.equal(bennett.effectiveSettings.burstTalentLevel, 13);
  assert.equal(
    lanYanC1.selectedSkill?.id,
    "lan-yan-feathermoon-rings",
  );
  assert.equal(
    lanYanC1.selectedSkill?.variants[0].nonCrit,
    (lanYanC0.selectedSkill?.variants[0].nonCrit ?? 0) * 2,
  );
  assert.equal(lanYanC1.selectedSkill?.segments?.length, 2);
});

test("uses Bennett base ATK after conversions and applies his C6 Pyro bonus", () => {
  const bennettC1 = teammatePlan({
    characterId: "bennett",
    weaponId: "skyward-blade",
    constellation: 1,
  });
  const sandroneBaseline = calculate(
    "sandrone",
    "a-teaspoon-of-transcendence",
  );
  const sandroneBuffed = calculate(
    "sandrone",
    "a-teaspoon-of-transcendence",
    { team: teamFor(bennettC1) },
  );
  const expectedAttackBuff = (191 + 608) * 1.21;
  assert.equal(
    sandroneBuffed.panel.atk - sandroneBaseline.panel.atk,
    Math.round(expectedAttackBuff),
  );
  assert.equal(
    sandroneBuffed.panel.elementalMastery,
    sandroneBaseline.panel.elementalMastery,
  );

  const bennettC5 = teammatePlan({
    characterId: "bennett",
    weaponId: "skyward-blade",
    constellation: 5,
  });
  const bennettC6 = teammatePlan({
    characterId: "bennett",
    weaponId: "skyward-blade",
    constellation: 6,
  });
  const arlecchinoC5 = calculate("arlecchino", "homa", {
    team: teamFor(bennettC5),
  });
  const arlecchinoC6 = calculate("arlecchino", "homa", {
    team: teamFor(bennettC6),
  });
  assert.ok(
    arlecchinoC6.selectedSkill!.variants[0].nonCrit >
      arlecchinoC5.selectedSkill!.variants[0].nonCrit,
  );
  assert.ok(
    arlecchinoC6.teamBuffs.some(
      (buff) => buff.name === "C6·烈火与勇气",
    ),
  );

  const kleeC5 = calculate("klee", "lost-prayer", {
    team: teamFor(bennettC5),
  });
  const kleeC6 = calculate("klee", "lost-prayer", {
    team: teamFor(bennettC6),
  });
  assert.equal(
    kleeC6.selectedSkill?.variants[0].nonCrit,
    kleeC5.selectedSkill?.variants[0].nonCrit,
  );
});

test("lets Lan Yan C4 mastery update off-field Sucrose's Moonsign bonus", () => {
  const createParty = (lanYanConstellation: number) => {
    const plans = [
      teammatePlan({
        characterId: "sucrose",
        weaponId: "sacrificial-fragments",
      }),
      teammatePlan({
        characterId: "lan-yan",
        weaponId: "thrilling-tales",
        constellation: lanYanConstellation,
      }),
      teammatePlan({
        characterId: "columbina",
        weaponId: "nocturnes-curtain-call",
      }),
    ];
    const configuration = createEmptyTeamConfiguration();
    plans.forEach((plan, slot) => {
      configuration.slots[slot] = {
        characterId: plan.snapshot.characterId,
        planId: plan.id,
      };
    });
    return createTeamCalculationInput(configuration, plans);
  };
  const getSucroseBonus = (
    result: ReturnType<typeof calculate>,
  ) => {
    const buff = result.teamBuffs.find(
      ({ sourceName, name }) =>
        sourceName === "砂糖" && name === "月兆·满辉队伍增益",
    );
    assert.ok(buff);
    const modifier = buff.modifiers.find(
      (candidate) =>
        candidate.kind === "damage" &&
        candidate.stat === "lunarReactionDamageBonus",
    );
    assert.ok(modifier && modifier.kind === "damage");
    return modifier.value;
  };
  const c3 = calculate("flins", "bloodsoaked-ruins", {
    team: createParty(3),
  });
  const c4 = calculate("flins", "bloodsoaked-ruins", {
    team: createParty(4),
  });

  assert.ok(
    Math.abs(getSucroseBonus(c4) - getSucroseBonus(c3) - 1.35) <
      1e-9,
  );
});

test("applies Escoffier's Cryo-Hydro resistance, C1, and C2 support", () => {
  const createParty = (escoffierConstellation: number) => {
    const plans = [
      teammatePlan({
        characterId: "escoffier",
        weaponId: "calamity-queller",
        constellation: escoffierConstellation,
      }),
      teammatePlan({
        characterId: "kokomi",
        weaponId: "prototype-amber",
      }),
      teammatePlan({
        characterId: "charlotte",
        weaponId: "oathsworn-eye",
      }),
    ];
    const configuration = createEmptyTeamConfiguration();
    plans.forEach((plan, slot) => {
      configuration.slots[slot] = {
        characterId: plan.snapshot.characterId,
        planId: plan.id,
      };
    });
    return createTeamCalculationInput(configuration, plans);
  };
  const c0 = calculate("ayaka", "mistsplitter", {
    team: createParty(0),
  });
  const c1 = calculate("ayaka", "mistsplitter", {
    team: createParty(1),
  });
  const c2 = calculate("ayaka", "mistsplitter", {
    team: createParty(2),
  });

  assert.equal(c0.effectiveResistance, -45);
  assert.equal(
    c1.teamBuffs
      .find((buff) => buff.name === "C1·味蕾绽放的餐前旋舞")
      ?.modifiers.find(
        (modifier) =>
          modifier.kind === "damage" &&
          modifier.stat === "critDmg",
      )?.value,
    60,
  );
  assert.ok(
    c2.selectedSkill!.variants[0].nonCrit >
      c1.selectedSkill!.variants[0].nonCrit,
  );
  assert.ok(
    c2.teamBuffs.some((buff) => buff.name === "C2·冷煮"),
  );
});

test("scales Xilonen Source Sample resistance shred and C2/C4 buffs", () => {
  const c0Plan = teammatePlan({
    characterId: "xilonen",
    weaponId: "favonius-sword",
  });
  const c3Plan = teammatePlan({
    characterId: "xilonen",
    weaponId: "favonius-sword",
    constellation: 3,
  });
  const c4Plan = teammatePlan({
    characterId: "xilonen",
    weaponId: "favonius-sword",
    constellation: 4,
  });
  const c0 = calculate("ayaka", "mistsplitter", {
    team: teamFor(c0Plan),
  });
  const c3 = calculate("ayaka", "mistsplitter", {
    team: teamFor(c3Plan),
  });
  const c4 = calculate("ayaka", "mistsplitter", {
    team: teamFor(c4Plan),
  });

  assert.equal(c0.effectiveResistance, -26);
  assert.equal(c3.effectiveResistance, -35);
  assert.equal(
    c3.teamBuffs
      .find(
        (buff) =>
          buff.name === "C2·献予灼原的五重奏",
      )
      ?.modifiers.find(
        (modifier) =>
          modifier.kind === "damage" &&
          modifier.stat === "critDmg",
      )?.value,
    60,
  );
  assert.ok(
    c4.teamBuffs.some((buff) => buff.name === "C4·荣花之赐"),
  );
});

test("applies Nicole C2 attack and matching elemental resistance buffs", () => {
  const nicoleC1 = teammatePlan({
    characterId: "nicole",
    weaponId: "lost-prayer",
    constellation: 1,
  });
  const nicoleC2 = teammatePlan({
    characterId: "nicole",
    weaponId: "lost-prayer",
    constellation: 2,
  });
  const c1 = calculate("hutao", "homa", {
    team: teamFor(nicoleC1),
  });
  const c2 = calculate("hutao", "homa", {
    team: teamFor(nicoleC2),
  });
  const c2Buff = c2.teamBuffs.find(
    (buff) =>
      buff.name === "C2·我要教导你，指引你应走的路",
  );

  assert.equal(c2.panel.atk - c1.panel.atk, 300);
  assert.equal(c1.effectiveResistance, 10);
  assert.equal(c2.effectiveResistance, -15);
  assert.equal(
    c2Buff?.modifiers.find(
      (modifier) =>
        modifier.kind === "panel" && modifier.stat === "flatAtk",
    )?.value,
    300,
  );
  assert.deepEqual(
    c2Buff?.modifiers.find(
      (modifier) =>
        modifier.kind === "damage" &&
        modifier.stat === "enemyResistanceReduction",
    ),
    {
      kind: "damage",
      stat: "enemyResistanceReduction",
      element: "pyro",
      value: 25,
    },
  );
  assert.equal(
    c1.teamBuffs.some((buff) => buff.id.includes("nicole-c2")),
    false,
  );
});

test("applies Citlali, Zhongli, and Furina support values", () => {
  const citlaliC0 = teammatePlan({
    characterId: "citlali",
    weaponId: "sacrificial-fragments",
  });
  const citlaliC2 = teammatePlan({
    characterId: "citlali",
    weaponId: "sacrificial-fragments",
    constellation: 2,
  });
  const zhongliPlan = teammatePlan({
    characterId: "zhongli",
    weaponId: "favonius-lance",
  });
  const furinaC0 = teammatePlan({
    characterId: "furina",
    weaponId: "splendor-of-tranquil-waters",
    damageSelections: { furinaFanfare: "300" },
  });
  const furinaC1 = teammatePlan({
    characterId: "furina",
    weaponId: "splendor-of-tranquil-waters",
    constellation: 1,
    damageSelections: { furinaFanfare: "400" },
  });

  const pyroC0 = calculate("hutao", "homa", {
    team: teamFor(citlaliC0),
  });
  const pyroC2 = calculate("hutao", "homa", {
    team: teamFor(citlaliC2),
  });
  const cryoZhongli = calculate("ayaka", "mistsplitter", {
    team: teamFor(zhongliPlan),
  });
  const cryoFurinaC0 = calculate("ayaka", "mistsplitter", {
    team: teamFor(furinaC0),
  });
  const cryoFurinaC1 = calculate("ayaka", "mistsplitter", {
    team: teamFor(furinaC1),
  });

  assert.equal(pyroC0.effectiveResistance, -10);
  assert.equal(pyroC2.effectiveResistance, -30);
  assert.equal(
    pyroC2.panel.elementalMastery - pyroC0.panel.elementalMastery,
    250,
  );
  assert.equal(cryoZhongli.effectiveResistance, -10);
  assert.equal(
    cryoFurinaC0.teamBuffs.find(
      (buff) => buff.name === "万众狂欢·气氛值",
    )?.modifiers[0]?.value,
    75,
  );
  assert.equal(
    cryoFurinaC1.teamBuffs.find(
      (buff) => buff.name === "万众狂欢·气氛值",
    )?.modifiers[0]?.value,
    100,
  );
});

test("supports every team-buff artifact set and its active state", () => {
  const cases = [
    {
      artifactSetId: "noblesse-oblige",
      selections: { noblesseState: "active" },
      buffName: "昔日宗室之仪四件套",
    },
    {
      artifactSetId: "instructor",
      selections: { instructorState: "active" },
      buffName: "教官四件套",
    },
    {
      artifactSetId: "archaic-petra",
      selections: { archaicPetraElement: "cryo" },
      buffName: "悠古的磐岩四件套",
    },
    {
      artifactSetId: "scroll-of-the-hero-of-cinder-city",
      selections: { cinderCityState: "nightsoul" },
      buffName: "烬城勇者绘卷四件套",
    },
    {
      artifactSetId: "song-of-days-past",
      selections: { songOfDaysPastHealing: "15000" },
      buffName: "昔时之歌四件套",
    },
  ] as const;

  for (const item of cases) {
    const plan = teammatePlan({
      characterId: "zhongli",
      weaponId: "favonius-lance",
      artifactSetId: item.artifactSetId,
      artifactSetPieces: 4,
      artifactSetSelections: { ...item.selections },
    });
    const result = calculate("ayaka", "mistsplitter", {
      team: teamFor(plan),
    });
    assert.ok(
      result.teamBuffs.some(
        (buff) =>
          buff.sourceKind === "artifact" &&
          buff.name === item.buffName,
      ),
      item.artifactSetId,
    );
  }
});

test("applies support artifact stats and Song of Days Past additive damage", () => {
  const plain = calculate("ayaka", "mistsplitter");
  const song = calculate("ayaka", "mistsplitter", {
    artifactSetId: "song-of-days-past",
    artifactSetPieces: 4,
    artifactSetSelections: {
      songOfDaysPastHealing: "15000",
    },
  });
  const maiden = calculate("furina", "splendor-of-tranquil-waters", {
    artifactSetId: "maiden-beloved",
    artifactSetPieces: 2,
  });
  const exile = calculate("zhongli", "favonius-lance", {
    artifactSetId: "the-exile",
    artifactSetPieces: 2,
  });
  const scholar = calculate("citlali", "sacrificial-fragments", {
    artifactSetId: "scholar",
    artifactSetPieces: 2,
  });
  const plainSkill = plain.skills.find(
    (skill) => skill.id === "ayaka-skill",
  )?.variants[0];
  const songSkill = song.skills.find(
    (skill) => skill.id === "ayaka-skill",
  )?.variants[0];

  assert.ok((songSkill?.nonCrit ?? 0) > (plainSkill?.nonCrit ?? 0));
  assert.equal(maiden.panel.healingBonus, 15);
  assert.equal(exile.panel.energyRecharge, 150.6);
  assert.equal(scholar.panel.energyRecharge, 120);
  assert.ok(
    ["maiden-beloved", "the-exile", "scholar"].every((id) =>
      artifactSets.some((set) => set.id === id),
    ),
  );
});
