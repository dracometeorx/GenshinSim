import { ayaka } from "./ayaka.ts";
import { columbina } from "./columbina.ts";
import { customCharacter } from "./custom.ts";
import { flins } from "./flins.ts";
import { hutao } from "./hutao.ts";
import { ineffa } from "./ineffa.ts";
import { lauma } from "./lauma.ts";
import { linnea } from "./linnea.ts";
import { nahida } from "./nahida.ts";
import { nefer } from "./nefer.ts";
import { raiden } from "./raiden.ts";
import { zibai } from "./zibai.ts";
import type { CharacterPreset } from "./types.ts";

export type { CharacterPreset } from "./types.ts";

export const characters: CharacterPreset[] = [
  ayaka,
  hutao,
  raiden,
  nahida,
  columbina,
  flins,
  ineffa,
  lauma,
  nefer,
  linnea,
  zibai,
  customCharacter,
];
