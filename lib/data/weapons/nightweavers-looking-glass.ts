import type { WeaponPreset } from "./types.ts";

const elementalMastery = [60, 75, 90, 105, 120] as const;
const lunarBloomBonus = [40, 50, 60, 70, 80] as const;

export const nightweaversLookingGlass: WeaponPreset = {
  id: "nightweavers-looking-glass",
  name: "纺夜天镜",
  weaponType: "catalyst",
  level: 90,
  refinement: 1,
  baseAtk: 542,
  secondaryStat: "elementalMastery",
  secondaryValue: 265,
  secondaryLabel: "元素精通 +265",
  passive: {
    name: "千年的大乐章",
    description:
      "造成水/草伤害与触发月绽放后各提高元素精通；两种效果同时存在时提高全队月绽放伤害。",
    panelEffects: [
      {
        id: "nightweavers-looking-glass-em",
        stage: "additive",
        conditional: true,
        evaluate: ({ refinementIndex, weaponSelections }) =>
          weaponSelections.nightweaversLookingGlassState === "inactive"
            ? []
            : [
                {
                  stat: "elementalMastery",
                  value: elementalMastery[refinementIndex] * 2,
                },
              ],
      },
    ],
    teamBuffs: [
      {
        id: "nightweavers-looking-glass-lunar-bloom",
        name: "朔月诗篇",
        description:
          "终北圣言与朔月诗篇同时存在时，提高全队月绽放反应伤害。",
        stackingGroup: "nightweavers-looking-glass-lunar-bloom",
        appliesToSelf: true,
        evaluate: ({ source }) =>
          source.weaponSelections.nightweaversLookingGlassState ===
          "inactive"
            ? []
            : [
                {
                  kind: "damage",
                  stat: "lunarReactionDamageBonus",
                  value:
                    lunarBloomBonus[
                      Math.min(
                        4,
                        Math.max(0, source.weaponRefinement - 1),
                      )
                    ],
                  lunarReactions: ["lunarBloom"],
                },
              ],
      },
    ],
    refinementDescriptions: elementalMastery.map(
      (value, index) =>
        `两种状态各提高 ${value} 点元素精通；同时生效时月绽放反应伤害提高 ${lunarBloomBonus[index]}%。`,
    ) as [string, string, string, string, string],
    control: {
      key: "nightweaversLookingGlassState",
      label: "纺夜天镜状态",
      defaultValue: "active",
      options: [
        { value: "inactive", label: "未触发" },
        { value: "active", label: "终北圣言与朔月诗篇均生效" },
      ],
    },
  },
};
