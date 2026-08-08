import type { ArtifactSetPreset } from "./types.ts";

const normalBonus = {
  kind: "damageBonus" as const,
  category: "normal" as const,
  value: 60,
};
const burstBonus = {
  kind: "damageBonus" as const,
  category: "burst" as const,
  value: 60,
};

export const finaleOfTheDeepGalleries: ArtifactSetPreset = {
  id: "finale-of-the-deep-galleries",
  name: "深廊终曲",
  shortName: "深廊",
  twoPiece: {
    description: "获得 15% 冰元素伤害加成。",
    modifiers: [
      {
        kind: "stat",
        stat: "elementalDmg",
        element: "cryo",
        value: 15,
      },
    ],
  },
  fourPiece: {
    description:
      "元素能量为 0 时，普通攻击与元素爆发伤害提高 60%；一种攻击命中后，另一种增益失效 6 秒。",
    control: {
      key: "deepGalleriesState",
      label: "深廊四件套状态",
      defaultValue: "both",
      options: [
        { value: "inactive", label: "元素能量不为 0" },
        {
          value: "both",
          label: "能量为 0 · 两类首击均可 +60%",
          modifiers: [normalBonus, burstBonus],
        },
        {
          value: "normalOnly",
          label: "爆发命中后 6 秒 · 仅普攻 +60%",
          modifiers: [normalBonus],
        },
        {
          value: "burstOnly",
          label: "普攻命中后 6 秒 · 仅爆发 +60%",
          modifiers: [burstBonus],
        },
      ],
    },
  },
};
