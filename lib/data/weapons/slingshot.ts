import type { WeaponPreset } from "./types.ts";

const closeRangeBonus = [36, 42, 48, 54, 60] as const;

export const slingshot: WeaponPreset = {
  id: "slingshot",
  name: "弹弓",
  weaponType: "bow",
  level: 90,
  refinement: 1,
  baseAtk: 354,
  secondaryStat: "critRate",
  secondaryValue: 31.2,
  secondaryLabel: "暴击率 +31.2%",
  passive: {
    name: "弹弓",
    description:
      "箭矢在发射后 0.3 秒内命中时提高普攻与重击伤害，否则伤害降低 10%。",
    damageEffects: [
      {
        id: "slingshot-distance",
        evaluate: ({
          refinementIndex,
          target,
          weaponSelections,
        }) =>
          target.category === "normal" ||
          target.category === "charged"
            ? [
                {
                  stat: "damageBonus",
                  value:
                    weaponSelections.slingshotState === "far"
                      ? -10
                      : closeRangeBonus[refinementIndex],
                },
              ]
            : [],
      },
    ],
    refinementDescriptions: closeRangeBonus.map(
      (value) =>
        `0.3 秒内命中时普攻/重击伤害提高 ${value}%，否则降低 10%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "slingshotState",
      label: "箭矢命中时间",
      defaultValue: "close",
      options: [
        { value: "close", label: "0.3 秒内命中" },
        { value: "far", label: "超过 0.3 秒命中" },
      ],
    },
  },
};
