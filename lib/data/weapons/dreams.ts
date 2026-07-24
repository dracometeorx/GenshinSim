import type { WeaponPreset } from "./types.ts";

const partyElementalMastery = [40, 42, 44, 46, 48] as const;

export const dreams: WeaponPreset = {
  id: "dreams",
  name: "千夜浮梦",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "elementalMastery",
  secondaryValue: 265,
  secondaryLabel: "元素精通 +265",
  passive: {
    name: "千夜的曙歌",
    description:
      "装备者根据队友元素获得自身加成；此外，装备者以外的队友元素精通提高 40 点。",
    teamBuffs: [
      {
        id: "dreams-party-elemental-mastery",
        name: "千夜的曙歌",
        description:
          "千夜浮梦使装备者以外的队友获得元素精通，数值随精炼等级提高。",
        evaluate: ({ source }) => [
          {
            kind: "panel",
            stat: "elementalMastery",
            value:
              partyElementalMastery[
                Math.min(
                  4,
                  Math.max(0, source.weaponRefinement - 1),
                )
              ],
          },
        ],
      },
    ],
    refinementDescriptions: [
      "装备者根据队友元素获得自身加成；装备者以外的队友元素精通提高 40 点。",
      "装备者根据队友元素获得自身加成；装备者以外的队友元素精通提高 42 点。",
      "装备者根据队友元素获得自身加成；装备者以外的队友元素精通提高 44 点。",
      "装备者根据队友元素获得自身加成；装备者以外的队友元素精通提高 46 点。",
      "装备者根据队友元素获得自身加成；装备者以外的队友元素精通提高 48 点。",
    ],
    teammateDependent: true,
  },
};
