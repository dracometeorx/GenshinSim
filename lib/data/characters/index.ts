import { ayaka } from "./ayaka.ts";
import { customCharacter } from "./custom.ts";
import { hutao } from "./hutao.ts";
import { nahida } from "./nahida.ts";
import { raiden } from "./raiden.ts";
import type { CharacterPreset } from "./types.ts";

export type { CharacterPreset } from "./types.ts";

export const characters: CharacterPreset[] = [
  ayaka,
  hutao,
  raiden,
  nahida,
  customCharacter,
];
