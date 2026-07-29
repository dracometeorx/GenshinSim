import type { ArtifactSetPreset } from "./types.ts";

export const scholar: ArtifactSetPreset = {
  id: "scholar",
  name: "学士",
  shortName: "学士",
  twoPiece: {
    description: "元素充能效率提高 20%。",
    modifiers: [
      {
        kind: "stat",
        stat: "energyRecharge",
        value: 20,
      },
    ],
  },
  fourPiece: {
    description:
      "获得元素微粒或元素晶球时，队伍中所有弓与法器角色额外恢复 3 点元素能量，每 3 秒至多触发一次。",
    panelNote:
      "固定回能不等同于元素充能效率，不写入队友面板或单次伤害。",
  },
};
