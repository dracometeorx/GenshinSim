import type { WeaponPreset } from "./types.ts";

const attackBonus = [24, 30, 36, 42, 48] as const;
const lunarChargedBonus = [40, 50, 60, 70, 80] as const;

export const fracturedHalo: WeaponPreset = {
  id: "fractured-halo",
  name: "支离轮光",
  weaponType: "polearm",
  level: 90,
  refinement: 1,
  baseAtk: 608,
  secondaryStat: "critDmg",
  secondaryValue: 66.2,
  secondaryLabel: "暴击伤害 +66.2%",
  passive: {
    name: "洁霜的玉冕",
    description:
      "施放元素战技或元素爆发后攻击力提高；在此期间创建护盾后，提高全队月感电伤害。",
    panelEffects: [
      {
        id: "fractured-halo-attack",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.fracturedHaloState === "inactive"
            ? []
            : [{ stat: "atkPct", value: attackBonus[refinementIndex] }],
      },
    ],
    teamBuffs: [
      {
        id: "fractured-halo-lunar-charged",
        name: "雷霆敕令",
        description:
          "施放战技或爆发后创建护盾，提高全队月感电伤害。",
        stackingGroup: "fractured-halo-lunar-charged",
        appliesToSelf: true,
        evaluate: ({ source }) =>
          source.weaponSelections.fracturedHaloState === "inactive"
            ? []
            : [
                {
                  kind: "damage",
                  stat: "lunarReactionDamageBonus",
                  value:
                    lunarChargedBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                  lunarReactions: ["lunarCharged"],
                },
              ],
      },
    ],
    refinementDescriptions: attackBonus.map(
      (value, index) =>
        `施放元素战技或元素爆发后攻击力提高 ${value}%；在此期间创建护盾后，全队月感电伤害提高 ${lunarChargedBonus[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "fracturedHaloState",
      label: "洁霜的玉冕",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        {
          value: "active",
          label: "已施放战技 / 爆发并创建护盾",
        },
      ],
    },
  },
};
