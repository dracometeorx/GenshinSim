import assert from "node:assert/strict";
import test from "node:test";

import { calculateBuild } from "../lib/calculation.ts";
import type { BuildInput } from "../lib/calculator.ts";
import { createEmptyTeamConfiguration } from "../lib/team-types.ts";
import type {
  CalculationTeamMember,
  TeamCalculationInput,
} from "../lib/team.ts";
import { defaultDamageSettings } from "../lib/damage.ts";
import {
  artifactSets,
  getArtifactSet,
  resolveArtifactModifiers,
} from "../lib/data/artifacts/index.ts";
import { characters } from "../lib/data/characters/index.ts";
import type { CharacterPreset } from "../lib/data/characters/types.ts";
import { getPreferredWeapon } from "../lib/build-plan-runtime.ts";

const hexereiIds = [
  "durin",
  "venti",
  "klee",
  "albedo",
  "mona",
  "fischl",
  "sucrose",
  "razor",
  "varka",
  "prune",
  "nicole",
  "lohen",
] as const;

function getCharacter(id: string) {
  const character = characters.find((item) => item.id === id);
  assert.ok(character, id);
  return character;
}

function buildFor(
  character: CharacterPreset,
  artifactSetId = "none",
  artifactSetPieces: 0 | 2 | 4 = 0,
  artifactSetSelections: Record<string, string> = {},
): BuildInput {
  const weapon = getPreferredWeapon(character);
  return {
    character,
    element: character.element,
    weapon,
    weaponPassiveSelections: {},
    artifactSetId,
    artifactSetPieces,
    artifactSetSelections,
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
      normal: 0,
      charged: 0,
      plunge: 0,
      skill: 0,
      burst: 0,
    },
  };
}

function memberFor(
  character: CharacterPreset,
  slot: number,
  artifactSetId = "none",
  artifactSetPieces: 0 | 2 | 4 = 0,
  artifactSetSelections: Record<string, string> = {},
): CalculationTeamMember {
  const build = buildFor(
    character,
    artifactSetId,
    artifactSetPieces,
    artifactSetSelections,
  );
  return {
    slot,
    planId: `${character.id}-plan`,
    constellation: 0,
    build,
    character,
    weapon: getPreferredWeapon(character),
    artifactSet: getArtifactSet(artifactSetId),
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
  };
}

function teamFor(
  ...members: CalculationTeamMember[]
): TeamCalculationInput {
  return {
    members,
    configuration: createEmptyTeamConfiguration(),
  };
}

function calculate(
  character: CharacterPreset,
  options: {
    artifactSetId?: string;
    artifactSetPieces?: 0 | 2 | 4;
    artifactSetSelections?: Record<string, string>;
    team?: TeamCalculationInput;
    selections?: Record<string, string>;
    constellation?: number;
  } = {},
) {
  const artifactSetId = options.artifactSetId ?? "none";
  const build = buildFor(
    character,
    artifactSetId,
    options.artifactSetPieces ?? 0,
    options.artifactSetSelections,
  );
  return calculateBuild({
    build,
    character,
    weapon: getPreferredWeapon(character),
    artifactSet: getArtifactSet(artifactSetId),
    settings: {
      ...defaultDamageSettings,
      selections: {
        ...defaultDamageSettings.selections,
        ...options.selections,
      },
    },
    constellation: options.constellation,
    team: options.team,
  });
}

test("catalogs every current Hexerei character as homework-complete", () => {
  assert.deepEqual(
    characters
      .filter(({ hexerei }) => hexerei)
      .map(({ id }) => id),
    hexereiIds,
  );
  for (const id of hexereiIds) {
    assert.ok(getCharacter(id).damageProfile, id);
  }
});

test("enables Secret Rite only with at least two distinct Hexerei characters", () => {
  const venti = getCharacter("venti");
  const solo = calculate(venti);
  const withKlee = calculate(venti, {
    team: teamFor(memberFor(getCharacter("klee"), 0)),
  });
  const duplicateVenti = calculate(venti, {
    team: teamFor(memberFor(venti, 0)),
  });

  assert.deepEqual(solo.hexerei, { count: 1, secretRite: false });
  assert.deepEqual(withKlee.hexerei, {
    count: 2,
    secretRite: true,
  });
  assert.deepEqual(duplicateVenti.hexerei, {
    count: 1,
    secretRite: false,
  });
  assert.ok(
    withKlee.skills[0].variants[0].nonCrit >
      solo.skills[0].variants[0].nonCrit,
  );
});

test("gates character Secret Rite buffs on party composition", () => {
  const lohen = getCharacter("lohen");
  const solo = calculate(lohen, {
    selections: { lohenRivalry: "100" },
  });
  const secret = calculate(lohen, {
    selections: { lohenRivalry: "100" },
    team: teamFor(memberFor(getCharacter("nicole"), 0)),
  });
  const soloNormal = solo.skills.find(
    ({ id }) => id === "lohen-first-normal",
  )?.variants[0];
  const secretNormal = secret.skills.find(
    ({ id }) => id === "lohen-first-normal",
  )?.variants[0];

  assert.ok(soloNormal && secretNormal);
  assert.equal(solo.hexerei.secretRite, false);
  assert.equal(secret.hexerei.secretRite, true);
  assert.ok(secretNormal.nonCrit > soloNormal.nonCrit);
  assert.ok(
    secret.teamBuffs.some(
      ({ name }) => name === "虚己之赐·圣祝之引",
    ),
  );
});

test("applies Sucrose constellation talent levels and C6 absorption buffs", () => {
  const sucrose = getCharacter("sucrose");
  assert.equal(sucrose.constellations?.length, 6);

  const c0 = calculate(sucrose, { constellation: 0 });
  const c3 = calculate(sucrose, { constellation: 3 });
  const c5 = calculate(sucrose, { constellation: 5 });
  assert.equal(c3.effectiveSettings.skillTalentLevel, 13);
  assert.equal(c5.effectiveSettings.burstTalentLevel, 13);
  assert.ok(
    c3.skills[0].variants[0].nonCrit >
      c0.skills[0].variants[0].nonCrit,
  );

  const c6Member = {
    ...memberFor(sucrose, 0),
    constellation: 6,
    settings: {
      ...defaultDamageSettings,
      selections: { sucroseBurstAbsorption: "pyro" },
    },
  };
  const c5Member = { ...c6Member, constellation: 5 };
  const hutao = getCharacter("hutao");
  const withoutC6 = calculate(hutao, {
    team: teamFor(c5Member),
  });
  const withC6 = calculate(hutao, {
    team: teamFor(c6Member),
  });
  assert.equal(
    withC6.panel.elementalDmg - withoutC6.panel.elementalDmg,
    20,
  );

  const klee = getCharacter("klee");
  const kleeWithoutC6 = calculate(klee, {
    team: teamFor(c5Member),
  });
  const kleeWithC6 = calculate(klee, {
    team: teamFor(c6Member),
  });
  assert.ok(
    Math.abs(
      kleeWithC6.panel.elementalDmg -
        kleeWithoutC6.panel.elementalDmg -
        28.6,
    ) < 1e-9,
  );
  const c6Buff = kleeWithC6.teamBuffs.find(
    ({ name }) => name === "C6·混元熵增论",
  );
  assert.ok(c6Buff);
  assert.deepEqual(c6Buff.modifiers, [
    {
      kind: "panel",
      stat: "elementalDmg",
      value: 28.57142,
    },
  ]);

  const ayakaWithPyroAbsorption = calculate(
    getCharacter("ayaka"),
    { team: teamFor(c6Member) },
  );
  assert.equal(
    ayakaWithPyroAbsorption.teamBuffs.some(
      ({ name }) => name === "C6·混元熵增论",
    ),
    false,
  );
});

test("resolves both Hexerei artifact sets from homework and Secret Rite", () => {
  const lohen = getCharacter("lohen");
  const risingWinds = calculate(lohen, {
    artifactSetId: "a-day-carved-from-rising-winds",
    artifactSetPieces: 4,
    artifactSetSelections: { risingWindsState: "active" },
  });
  const celestialSolo = calculate(lohen, {
    artifactSetId: "celestial-gift",
    artifactSetPieces: 4,
    artifactSetSelections: { celestialGiftState: "active" },
  });
  const celestialSecret = calculate(lohen, {
    artifactSetId: "celestial-gift",
    artifactSetPieces: 4,
    artifactSetSelections: { celestialGiftState: "active" },
    team: teamFor(memberFor(getCharacter("klee"), 0)),
  });

  assert.equal(risingWinds.panel.critRate, 25);
  assert.equal(celestialSolo.panel.elementalDmg, 20);
  assert.equal(celestialSecret.panel.elementalDmg, 40);

  const nonHomework = resolveArtifactModifiers(
    getArtifactSet("a-day-carved-from-rising-winds"),
    4,
    { risingWindsState: "active" },
    true,
    {
      characterElement: "cryo",
      witchHomeworkCompleted: false,
      hexereiSecretRite: false,
    },
  );
  assert.equal(
    nonHomework.some(
      (modifier) =>
        modifier.kind === "stat" &&
        modifier.stat === "critRate",
    ),
    false,
  );
});

test("applies Viridescent shred to every Swirl-compatible element on its wearer", () => {
  const lohen = getCharacter("lohen");
  const baseline = calculate(lohen);
  const withViridescent = calculate(lohen, {
    artifactSetId: "viridescent-venerer",
    artifactSetPieces: 4,
  });
  const modifiers = resolveArtifactModifiers(
    getArtifactSet("viridescent-venerer"),
    4,
    { viridescentSwirlElement: "pyro" },
    true,
  ).filter(
    (modifier) =>
      modifier.kind === "enemyResistanceReduction",
  );

  assert.deepEqual(
    modifiers,
    ["pyro", "hydro", "electro", "cryo"].map((element) => ({
      kind: "enemyResistanceReduction",
      value: 40,
      element,
    })),
  );
  assert.equal(withViridescent.effectiveResistance, -30);
  assert.ok(
    withViridescent.skills[0].variants[0].nonCrit >
      baseline.skills[0].variants[0].nonCrit,
  );
});

test("applies all-element Viridescent resistance shred from a teammate", () => {
  const lohen = getCharacter("lohen");
  const baseline = calculate(lohen, {
    team: teamFor(memberFor(getCharacter("sucrose"), 0)),
  });
  const withTeammateViridescent = calculate(lohen, {
    team: teamFor(
      memberFor(
        getCharacter("sucrose"),
        0,
        "viridescent-venerer",
        4,
        { viridescentSwirlElement: "cryo" },
      ),
    ),
  });

  assert.equal(withTeammateViridescent.effectiveResistance, -30);
  assert.ok(
    withTeammateViridescent.skills[0].variants[0].nonCrit >
      baseline.skills[0].variants[0].nonCrit,
  );
  const buff = withTeammateViridescent.teamBuffs.find(
    ({ name }) => name === "翠绿之影四件套",
  );
  assert.ok(buff);
  assert.deepEqual(
    buff.modifiers,
    ["pyro", "hydro", "electro", "cryo"].map((element) => ({
      kind: "damage",
      stat: "enemyResistanceReduction",
      value: 40,
      element,
    })),
  );
});

test("does not stack Viridescent resistance shred from multiple wearers", () => {
  const lohen = getCharacter("lohen");
  const result = calculate(lohen, {
    artifactSetId: "viridescent-venerer",
    artifactSetPieces: 4,
    team: teamFor(
      memberFor(
        getCharacter("sucrose"),
        0,
        "viridescent-venerer",
        4,
      ),
    ),
  });

  assert.equal(result.effectiveResistance, -30);
  assert.equal(
    result.teamBuffs.filter(
      ({ name }) => name === "翠绿之影四件套",
    ).length,
    0,
  );
});

test("keeps Beidou C6 resistance shred fixed to Electro and Cryo", () => {
  const beidouMember = {
    ...memberFor(getCharacter("beidou"), 0),
    constellation: 6,
  };
  const result = calculate(getCharacter("sandrone"), {
    team: teamFor(
      beidouMember,
      memberFor(getCharacter("qiqi"), 1),
    ),
  });
  const buff = result.teamBuffs.find(
    ({ name }) => name === "C6·星极破浪",
  );

  assert.ok(buff);
  assert.deepEqual(
    buff.modifiers.filter(
      (modifier) =>
        modifier.kind === "damage" &&
        modifier.stat === "enemyResistanceReduction",
    ),
    [
      {
        kind: "damage",
        stat: "enemyResistanceReduction",
        value: 15,
        element: "electro",
      },
      {
        kind: "damage",
        stat: "enemyResistanceReduction",
        value: 15,
        element: "cryo",
      },
    ],
  );
});

test("makes Durin's white-form resistance elements explicit", () => {
  const durinMember = memberFor(getCharacter("durin"), 0);
  durinMember.settings = {
    ...durinMember.settings,
    selections: {
      ...durinMember.settings.selections,
      durinForm: "white",
      durinWhiteReactionElement: "cryo",
    },
  };
  const result = calculate(getCharacter("klee"), {
    team: teamFor(durinMember),
  });
  const buff = result.teamBuffs.find(
    ({ name }) => name === "白焰之龙·光灵显现",
  );

  assert.ok(buff);
  assert.deepEqual(
    buff.modifiers.filter(
      (modifier) =>
        modifier.kind === "damage" &&
        modifier.stat === "enemyResistanceReduction",
    ),
    [
      {
        kind: "damage",
        stat: "enemyResistanceReduction",
        element: "pyro",
        value: 35,
      },
      {
        kind: "damage",
        stat: "enemyResistanceReduction",
        element: "cryo",
        value: 35,
      },
    ],
  );
});

test("applies Tenacity attack from teammates", () => {
  const lohen = getCharacter("lohen");
  const baseline = calculate(lohen);
  const withTenacity = calculate(lohen, {
    team: teamFor(
      memberFor(
        getCharacter("klee"),
        0,
        "tenacity-of-the-millelith",
        4,
        { tenacityState: "active" },
      ),
    ),
  });

  assert.ok(withTenacity.panel.atk > baseline.panel.atk);
  assert.ok(
    withTenacity.teamBuffs.some(
      ({ name }) => name === "千岩牢固四件套",
    ),
  );
});

test("exports all four requested artifact sets", () => {
  for (const id of [
    "a-day-carved-from-rising-winds",
    "celestial-gift",
    "viridescent-venerer",
    "tenacity-of-the-millelith",
  ]) {
    assert.ok(artifactSets.some((artifact) => artifact.id === id), id);
  }
});
