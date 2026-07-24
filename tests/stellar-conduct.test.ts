import assert from "node:assert/strict";
import test from "node:test";

import {
  createBuildPlan,
  createBuildPlanSnapshot,
} from "../lib/build-plans.ts";
import { calculateBuild } from "../lib/calculation.ts";
import type { BuildInput } from "../lib/calculator.ts";
import {
  defaultDamageSettings,
  getPolestarElementalDamageBonus,
  getStellarReactionCoefficient,
} from "../lib/damage.ts";
import { getArtifactSet } from "../lib/data/artifacts/index.ts";
import {
  characters,
  type CharacterPreset,
} from "../lib/data/characters/index.ts";
import {
  weapons,
  type WeaponPreset,
} from "../lib/data/weapons/index.ts";
import { createTeamCalculationInput } from "../lib/team.ts";
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

const talentBonuses: BuildInput["talentBonuses"] = {
  skill: 0,
  burst: 0,
  normal: 0,
  charged: 0,
  plunge: 0,
};

const stellarCharacterIds = [
  "sandrone",
  "qiqi",
  "yae-miko",
  "wriothesley",
  "cyno",
  "beidou",
  "diona",
] as const;
const directStellarCharacterIds = [
  "sandrone",
  "qiqi",
  "yae-miko",
  "wriothesley",
  "cyno",
] as const;

function getCharacter(id: string) {
  const character = characters.find((item) => item.id === id);
  assert.ok(character, id);
  return character;
}

function getWeapon(character: CharacterPreset) {
  const weapon = weapons.find(
    (item) => item.id === character.defaultWeaponId,
  );
  assert.ok(weapon, character.defaultWeaponId);
  return weapon;
}

function createBuild(
  character: CharacterPreset,
  weapon = getWeapon(character),
  options: Partial<BuildInput> = {},
): BuildInput {
  return {
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
    ...options,
  };
}

function createTeammatePlan(
  character: CharacterPreset,
  index: number,
) {
  const weapon = getWeapon(character);
  return createBuildPlan(
    createBuildPlanSnapshot({
      build: createBuild(character, weapon),
      characterId: character.id,
      weaponId: weapon.id,
      damageSettings: defaultDamageSettings,
    }),
    `${character.name}队友`,
    { id: `stellar-teammate-${index}-${character.id}` },
  );
}

function calculateCharacter({
  character,
  teammates,
  settings = defaultDamageSettings,
  constellation = 0,
  build = createBuild(character),
}: {
  character: CharacterPreset;
  teammates: CharacterPreset[];
  settings?: typeof defaultDamageSettings;
  constellation?: number;
  build?: BuildInput;
}) {
  const configuration = createEmptyTeamConfiguration();
  const plans = teammates.map(createTeammatePlan);
  plans.forEach((plan, index) => {
    configuration.slots[index] = {
      characterId: plan.snapshot.characterId,
      planId: plan.id,
    };
  });
  const weapon = weapons.find(
    (item) => item.id === build.weapon.id,
  ) as WeaponPreset | undefined;
  assert.ok(weapon);
  return calculateBuild({
    build,
    character,
    weapon,
    artifactSet: getArtifactSet(build.artifactSetId),
    settings,
    constellation,
    team: createTeamCalculationInput(configuration, plans),
  });
}

function firstDirectStellar(result: ReturnType<typeof calculateBuild>) {
  const variant = result.skills
    .flatMap((skill) => skill.variants)
    .find((item) => item.model === "directStellar");
  assert.ok(variant);
  return variant;
}

test("exports the seven live Stellar-Conduct related characters", () => {
  assert.deepEqual(
    characters
      .filter(({ stellarConduct }) => stellarConduct)
      .map(({ id }) => id),
    stellarCharacterIds,
  );
  assert.equal(getCharacter("sandrone").stellarConduct, "enabler");
  for (const id of stellarCharacterIds.slice(1)) {
    assert.equal(getCharacter(id).stellarConduct, "related", id);
  }
});

test("uses the Polestar Field elemental-power tables", () => {
  assert.deepEqual(
    [0, 1, 6, 12].map(getStellarReactionCoefficient),
    [1, 1.45, 1.7, 2],
  );
  assert.deepEqual(
    [0, 1, 6, 12].map(getPolestarElementalDamageBonus),
    [20, 29, 34, 40],
  );
  assert.equal(getStellarReactionCoefficient(-1), 1);
  assert.equal(getStellarReactionCoefficient(99), 2);
});

test("requires Sandrone plus Cryo and Electro to establish the field", () => {
  const sandrone = getCharacter("sandrone");
  const yae = getCharacter("yae-miko");
  const inactive = calculateCharacter({
    character: sandrone,
    teammates: [],
  });
  const active = calculateCharacter({
    character: sandrone,
    teammates: [yae],
  });

  assert.deepEqual(inactive.stellarConduct, {
    enablerCount: 1,
    active: false,
    elementalPower: 0,
  });
  assert.equal(inactive.skills.length, 0);
  assert.ok(
    inactive.warnings.some(
      ({ code }) => code === "STELLAR_CONDUCT_INACTIVE",
    ),
  );
  assert.deepEqual(active.stellarConduct, {
    enablerCount: 1,
    active: true,
    elementalPower: 12,
  });
  assert.ok(
    active.skills.every(
      (skill) => skill.model === "directStellar",
    ),
  );
  assert.equal(
    active.panel.elementalDmg - inactive.panel.elementalDmg,
    40,
  );
});

test("provides direct Stellar-Conduct targets for all five damage dealers", () => {
  const sandrone = getCharacter("sandrone");
  const yae = getCharacter("yae-miko");
  const teammatesByTarget: Record<string, CharacterPreset[]> = {
    sandrone: [yae],
    qiqi: [sandrone, yae],
    "yae-miko": [sandrone],
    wriothesley: [sandrone, yae],
    cyno: [sandrone],
  };

  for (const id of directStellarCharacterIds) {
    const result = calculateCharacter({
      character: getCharacter(id),
      teammates: teammatesByTarget[id],
    });
    assert.equal(result.stellarConduct.active, true, id);
    assert.ok(result.skills.length > 0, id);
    assert.ok(
      result.skills.every(
        (skill) =>
          skill.model === "directStellar" &&
          skill.variants.every(
            (variant) =>
              variant.model === "directStellar" &&
              variant.defenseMultiplier === 1,
          ),
      ),
      id,
    );
  }
});

test("direct Stellar damage ignores enemy defense and ordinary damage bonus", () => {
  const sandrone = getCharacter("sandrone");
  const yae = getCharacter("yae-miko");
  const base = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    settings: {
      ...defaultDamageSettings,
      enemyLevel: 1,
    },
  });
  const altered = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    settings: {
      ...defaultDamageSettings,
      enemyLevel: 200,
    },
    build: createBuild(sandrone, undefined, {
      artifact: {
        ...artifact,
        elementalDmg: 500,
      },
      talentBonuses: {
        ...talentBonuses,
        charged: 500,
        skill: 500,
        burst: 500,
      },
    }),
  });

  assert.equal(
    firstDirectStellar(base).nonCrit,
    firstDirectStellar(altered).nonCrit,
  );
});

test("elemental power 12 doubles coefficient-sourced direct damage over power 0", () => {
  const sandrone = getCharacter("sandrone");
  const yae = getCharacter("yae-miko");
  const atZero = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        stellarElementalPower: "0",
      },
    },
  });
  const atTwelve = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        stellarElementalPower: "12",
      },
    },
  });
  const zeroDamage = firstDirectStellar(atZero).nonCrit;
  const twelveDamage = firstDirectStellar(atTwelve).nonCrit;

  assert.ok(Math.abs(twelveDamage - zeroDamage * 2) <= 1);
});

test("adds the Stellar artifact set and Sandrone signature effects", () => {
  const sandrone = getCharacter("sandrone");
  const yae = getCharacter("yae-miko");
  const weapon = getWeapon(sandrone);
  assert.equal(weapon.id, "a-teaspoon-of-transcendence");
  assert.equal(getArtifactSet("delusion-of-immolated-shadow").name, "影中沉凝的幻灭");

  const noStacks = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    build: createBuild(sandrone, weapon, {
      weaponPassiveSelections: { transcendenceStacks: "0" },
    }),
  });
  const fullStacks = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    build: createBuild(sandrone, weapon, {
      weaponPassiveSelections: { transcendenceStacks: "3" },
    }),
  });
  const artifactResult = calculateCharacter({
    character: sandrone,
    teammates: [yae],
    build: createBuild(sandrone, weapon, {
      artifactSetId: "delusion-of-immolated-shadow",
      artifactSetPieces: 4,
      artifactSetSelections: {
        delusionStellarState: "active",
      },
    }),
  });

  assert.ok(
    firstDirectStellar(fullStacks).nonCrit >
      firstDirectStellar(noStacks).nonCrit,
  );
  assert.ok(
    firstDirectStellar(artifactResult).nonCrit >
      firstDirectStellar(fullStacks).nonCrit,
  );
});
