import type { BuildInput } from "./calculator.ts";
import { characters } from "./data/characters/index.ts";
import { weapons } from "./data/weapons/index.ts";

export const defaultBuild: BuildInput = {
  element: "cryo",
  character: characters[0],
  weapon: weapons[0],
  weaponPassiveSelections: {
    mistsplitterStacks: "0",
  },
  artifactSetId: "blizzard-strayer",
  artifactSetPieces: 4,
  artifactSetSelections: {
    blizzardEnemyState: "frozen",
  },
  artifact: {
    flatHp: 9615,
    flatAtk: 1110,
    flatDef: 62,
    critRate: 37.7,
    critDmg: 96.1,
    energyRecharge: 18.1,
    elementalMastery: 0,
    elementalDmg: 61.6,
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

export function cloneDefaultBuild(): BuildInput {
  return {
    ...defaultBuild,
    character: { ...defaultBuild.character },
    weapon: { ...defaultBuild.weapon },
    weaponPassiveSelections: {
      ...defaultBuild.weaponPassiveSelections,
    },
    artifactSetSelections: {
      ...defaultBuild.artifactSetSelections,
    },
    artifact: { ...defaultBuild.artifact },
    talentBonuses: { ...defaultBuild.talentBonuses },
  };
}
