import { customWeapon } from "./custom.ts";
import { deathmatch } from "./deathmatch.ts";
import { dragonsBane } from "./dragons-bane.ts";
import { dreams } from "./dreams.ts";
import { engulfing } from "./engulfing.ts";
import { favoniusLance } from "./favonius-lance.ts";
import { homa } from "./homa.ts";
import { mistsplitter } from "./mistsplitter.ts";
import { theCatch } from "./the-catch.ts";
import { fracturedHalo } from "./fractured-halo.ts";
import { bloodsoakedRuins } from "./bloodsoaked-ruins.ts";
import { nightweaversLookingGlass } from "./nightweavers-looking-glass.ts";
import { reliquaryOfTruth } from "./reliquary-of-truth.ts";
import { nocturnesCurtainCall } from "./nocturnes-curtain-call.ts";
import { lightbearingMoonshard } from "./lightbearing-moonshard.ts";
import { frostboundOath } from "./frostbound-oath.ts";
import { balladOfTheFjords } from "./ballad-of-the-fjords.ts";
import { tamayurateiNoOhanashi } from "./tamayuratei-no-ohanashi.ts";
import { prospectorsShovel } from "./prospectors-shovel.ts";
import { calamityQueller } from "./calamity-queller.ts";
import { missiveWindspear } from "./missive-windspear.ts";
import { lostPrayer } from "./lost-prayer.ts";
import { dawningFrost } from "./dawning-frost.ts";
import { etherlightSpindlelute } from "./etherlight-spindlelute.ts";
import { wanderingEvenstar } from "./wandering-evenstar.ts";
import { sacrificialJade } from "./sacrificial-jade.ts";
import { oathswornEye } from "./oathsworn-eye.ts";
import { sacrificialFragments } from "./sacrificial-fragments.ts";
import { theWidsith } from "./the-widsith.ts";
import { solarPearl } from "./solar-pearl.ts";
import { prototypeAmber } from "./prototype-amber.ts";
import { thrillingTales } from "./thrilling-tales.ts";
import { azurelight } from "./azurelight.ts";
import { splendorOfTranquilWaters } from "./splendor-of-tranquil-waters.ts";
import { skywardBlade } from "./skyward-blade.ts";
import { wolfFang } from "./wolf-fang.ts";
import { theBlackSword } from "./the-black-sword.ts";
import { theDockhandsAssistant } from "./the-dockhands-assistant.ts";
import { xiphosMoonlight } from "./xiphos-moonlight.ts";
import { calamityOfEshu } from "./calamity-of-eshu.ts";
import { favoniusSword } from "./favonius-sword.ts";
import { cinnabarSpindle } from "./cinnabar-spindle.ts";
import { slingshot } from "./slingshot.ts";
import { favoniusWarbow } from "./favonius-warbow.ts";
import { skywardHarp } from "./skyward-harp.ts";
import { theFirstGreatMagic } from "./the-first-great-magic.ts";
import { amosBow } from "./amos-bow.ts";
import { theStringless } from "./the-stringless.ts";
import { rust } from "./rust.ts";
import { theViridescentHunt } from "./the-viridescent-hunt.ts";
import { wolfsGravestone } from "./wolfs-gravestone.ts";
import { skywardPride } from "./skyward-pride.ts";
import { ultimateOverlordsMegaMagicSword } from "./ultimate-overlords-mega-magic-sword.ts";
import { makhairaAquamarine } from "./makhaira-aquamarine.ts";
import { talkingStick } from "./talking-stick.ts";
import { tidalShadow } from "./tidal-shadow.ts";
import { serpentSpine } from "./serpent-spine.ts";
import { aTeaspoonOfTranscendence } from "./a-teaspoon-of-transcendence.ts";
import { aThousandBlazingSuns } from "./a-thousand-blazing-suns.ts";
import type { WeaponPreset } from "./types.ts";
import type { WeaponType } from "../../calculator.ts";

export type { WeaponPreset } from "./types.ts";

export type WeaponRarity = 3 | 4 | 5;

const threeStarWeaponIds = new Set([
  "thrilling-tales",
  "slingshot",
]);

const fourStarWeaponIds = new Set([
  "the-catch",
  "deathmatch",
  "dragons-bane",
  "favonius-lance",
  "ballad-of-the-fjords",
  "tamayuratei-no-ohanashi",
  "prospectors-shovel",
  "missive-windspear",
  "dawning-frost",
  "etherlight-spindlelute",
  "wandering-evenstar",
  "sacrificial-jade",
  "oathsworn-eye",
  "sacrificial-fragments",
  "the-widsith",
  "solar-pearl",
  "prototype-amber",
  "wolf-fang",
  "the-black-sword",
  "the-dockhands-assistant",
  "xiphos-moonlight",
  "calamity-of-eshu",
  "favonius-sword",
  "cinnabar-spindle",
  "favonius-warbow",
  "the-stringless",
  "rust",
  "the-viridescent-hunt",
  "ultimate-overlords-mega-magic-sword",
  "makhaira-aquamarine",
  "talking-stick",
  "tidal-shadow",
  "serpent-spine",
]);

const fiveStarWeaponIds = new Set([
  "mistsplitter",
  "homa",
  "engulfing",
  "dreams",
  "fractured-halo",
  "bloodsoaked-ruins",
  "nightweavers-looking-glass",
  "reliquary-of-truth",
  "nocturnes-curtain-call",
  "lightbearing-moonshard",
  "frostbound-oath",
  "calamity-queller",
  "lost-prayer",
  "azurelight",
  "splendor-of-tranquil-waters",
  "skyward-blade",
  "skyward-harp",
  "the-first-great-magic",
  "amos-bow",
  "a-thousand-blazing-suns",
  "wolfs-gravestone",
  "skyward-pride",
  "a-teaspoon-of-transcendence",
]);

export function getWeaponRarity(
  weapon: WeaponPreset | string,
): WeaponRarity | null {
  const id = typeof weapon === "string" ? weapon : weapon.id;
  if (threeStarWeaponIds.has(id)) return 3;
  if (fourStarWeaponIds.has(id)) return 4;
  if (fiveStarWeaponIds.has(id)) return 5;
  return null;
}

export function getDefaultWeaponRefinement(
  weapon: WeaponPreset | string,
) {
  const rarity = getWeaponRarity(weapon);
  return rarity === 3 || rarity === 4 ? 5 : 1;
}

export const weapons: WeaponPreset[] = [
  mistsplitter,
  homa,
  engulfing,
  theCatch,
  deathmatch,
  dragonsBane,
  favoniusLance,
  dreams,
  fracturedHalo,
  bloodsoakedRuins,
  nightweaversLookingGlass,
  reliquaryOfTruth,
  nocturnesCurtainCall,
  lightbearingMoonshard,
  frostboundOath,
  balladOfTheFjords,
  tamayurateiNoOhanashi,
  prospectorsShovel,
  calamityQueller,
  missiveWindspear,
  lostPrayer,
  dawningFrost,
  etherlightSpindlelute,
  wanderingEvenstar,
  sacrificialJade,
  oathswornEye,
  sacrificialFragments,
  theWidsith,
  solarPearl,
  prototypeAmber,
  thrillingTales,
  azurelight,
  splendorOfTranquilWaters,
  skywardBlade,
  wolfFang,
  theBlackSword,
  theDockhandsAssistant,
  xiphosMoonlight,
  calamityOfEshu,
  favoniusSword,
  cinnabarSpindle,
  slingshot,
  favoniusWarbow,
  skywardHarp,
  theFirstGreatMagic,
  amosBow,
  theStringless,
  rust,
  theViridescentHunt,
  aThousandBlazingSuns,
  wolfsGravestone,
  skywardPride,
  ultimateOverlordsMegaMagicSword,
  makhairaAquamarine,
  talkingStick,
  tidalShadow,
  serpentSpine,
  aTeaspoonOfTranscendence,
  customWeapon,
];

export const weaponTypeLabels: Record<WeaponType, string> = {
  sword: "单手剑",
  claymore: "双手剑",
  polearm: "长柄武器",
  bow: "弓",
  catalyst: "法器",
  any: "任意武器",
};

export function isWeaponCompatible(
  characterWeaponType: WeaponType,
  weapon: WeaponPreset,
) {
  return (
    characterWeaponType === "any" ||
    weapon.weaponType === "any" ||
    characterWeaponType === weapon.weaponType
  );
}

export function getCompatibleWeapons(characterWeaponType: WeaponType) {
  return weapons.filter((weapon) =>
    isWeaponCompatible(characterWeaponType, weapon),
  );
}
