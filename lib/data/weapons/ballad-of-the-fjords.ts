import type { WeaponPreset } from "./types.ts";

const elementalMastery = [120, 150, 180, 210, 240] as const;

export const balladOfTheFjords: WeaponPreset = {
  id: "ballad-of-the-fjords",
  name: "峡湾长歌",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 510,
  secondaryStat: "critRate",
  secondaryValue: 27.6,
  secondaryLabel: "暴击率 +27.6%",
  passive: {
    name: "冰原的诸多故事",
    description:
      "队伍中存在至少三种不同元素类型的角色时，元素精通提高。",
    teamBuffs: [
      {
        id: "ballad-of-the-fjords-mastery",
        name: "冰原的诸多故事",
        description:
          "队伍中存在至少三种不同元素类型时，提高装备者的元素精通。",
        appliesToSelf: true,
        appliesToTeammates: false,
        evaluate: ({ source, party }) =>
          new Set(party.elements).size >= 3
            ? [
                {
                  kind: "panel",
                  stat: "elementalMastery",
                  value:
                    elementalMastery[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: elementalMastery.map(
      (value) =>
        `队伍中存在至少三种不同元素类型时，元素精通提高 ${value} 点。`,
    ) as [string, string, string, string, string],
  },
};
