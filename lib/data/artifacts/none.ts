import type { ArtifactSetPreset } from "./types.ts";

export const noArtifactSet: ArtifactSetPreset = {
  id: "none",
  name: "无套装效果",
  shortName: "无套装",
  twoPiece: {
    description: "不启用圣遗物套装加成。",
  },
  fourPiece: {
    description: "不启用圣遗物套装加成。",
  },
};
