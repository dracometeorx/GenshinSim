import { ayaka } from "./ayaka.ts";
import { albedo } from "./albedo.ts";
import { columbina } from "./columbina.ts";
import { customCharacter } from "./custom.ts";
import { durin } from "./durin.ts";
import { fischl } from "./fischl.ts";
import { flins } from "./flins.ts";
import { hutao } from "./hutao.ts";
import { ineffa } from "./ineffa.ts";
import { klee } from "./klee.ts";
import { lauma } from "./lauma.ts";
import { linnea } from "./linnea.ts";
import { lohen } from "./lohen.ts";
import { mona } from "./mona.ts";
import { nahida } from "./nahida.ts";
import { xilonen } from "./xilonen.ts";
import { citlali } from "./citlali.ts";
import { zhongli } from "./zhongli.ts";
import { furina } from "./furina.ts";
import { kokomi } from "./kokomi.ts";
import { escoffier } from "./escoffier.ts";
import { charlotte } from "./charlotte.ts";
import { yelan } from "./yelan.ts";
import { xingqiu } from "./xingqiu.ts";
import { arlecchino } from "./arlecchino.ts";
import { mavuika } from "./mavuika.ts";
import { skirk } from "./skirk.ts";
import { chiori } from "./chiori.ts";
import { nefer } from "./nefer.ts";
import { nicole } from "./nicole.ts";
import { prune } from "./prune.ts";
import { raiden } from "./raiden.ts";
import { razor } from "./razor.ts";
import { sucrose } from "./sucrose.ts";
import { varka } from "./varka.ts";
import { venti } from "./venti.ts";
import { zibai } from "./zibai.ts";
import { sandrone } from "./sandrone.ts";
import { qiqi } from "./qiqi.ts";
import { yaeMiko } from "./yae-miko.ts";
import { wriothesley } from "./wriothesley.ts";
import { cyno } from "./cyno.ts";
import { beidou } from "./beidou.ts";
import { diona } from "./diona.ts";
import { bennett } from "./bennett.ts";
import { lanYan } from "./lan-yan.ts";
import type { CharacterPreset } from "./types.ts";

export type { CharacterPreset } from "./types.ts";

export type CharacterRarity = 4 | 5;

const fourStarCharacterIds = new Set([
  "xingqiu",
  "beidou",
  "diona",
  "fischl",
  "sucrose",
  "razor",
  "prune",
  "charlotte",
  "bennett",
  "lan-yan",
]);

const fiveStarCharacterIds = new Set([
  "ayaka",
  "hutao",
  "raiden",
  "nahida",
  "xilonen",
  "citlali",
  "zhongli",
  "furina",
  "yelan",
  "arlecchino",
  "mavuika",
  "skirk",
  "chiori",
  "columbina",
  "flins",
  "ineffa",
  "lauma",
  "nefer",
  "linnea",
  "zibai",
  "sandrone",
  "qiqi",
  "yae-miko",
  "wriothesley",
  "cyno",
  "durin",
  "venti",
  "klee",
  "albedo",
  "mona",
  "varka",
  "nicole",
  "lohen",
  "kokomi",
  "escoffier",
]);

export function getCharacterRarity(
  character: CharacterPreset | string,
): CharacterRarity | null {
  const id = typeof character === "string" ? character : character.id;
  if (fourStarCharacterIds.has(id)) return 4;
  if (fiveStarCharacterIds.has(id)) return 5;
  return null;
}

export function getDefaultConstellation(
  character: CharacterPreset | string,
) {
  const rarity = getCharacterRarity(character);
  return rarity === 4 ? 6 : 0;
}

export const characters: CharacterPreset[] = [
  ayaka,
  hutao,
  raiden,
  nahida,
  xilonen,
  citlali,
  zhongli,
  furina,
  kokomi,
  escoffier,
  charlotte,
  yelan,
  xingqiu,
  bennett,
  lanYan,
  arlecchino,
  mavuika,
  skirk,
  chiori,
  columbina,
  flins,
  ineffa,
  lauma,
  nefer,
  linnea,
  zibai,
  sandrone,
  qiqi,
  yaeMiko,
  wriothesley,
  cyno,
  beidou,
  diona,
  durin,
  venti,
  klee,
  albedo,
  mona,
  fischl,
  sucrose,
  razor,
  varka,
  prune,
  nicole,
  lohen,
  customCharacter,
];
