import type {
  CharacterBase,
  ElementKey,
  WeaponType,
} from "../../calculator.ts";

export type DamageReaction = "none" | "vaporize" | "melt" | "spread";

export type DamageControl = {
  key: string;
  label: string;
  defaultValue: string;
  options: Array<{
    value: string;
    label: string;
  }>;
};

type BaseDamageProfile = {
  talentLabel: string;
  controls: DamageControl[];
};

export type CharacterDamageProfile =
  | (BaseDamageProfile & {
      kind: "ayaka";
      skillMultipliers: number[];
      burstCutMultipliers: number[];
      burstBloomMultipliers: number[];
    })
  | (BaseDamageProfile & {
      kind: "hutao";
      chargedMultipliers: number[];
      skillHpToAtkRatios: number[];
      burstMultipliers: number[];
      lowHpBurstMultipliers: number[];
    })
  | (BaseDamageProfile & {
      kind: "raiden";
      burstMultipliers: number[];
      resolvePerStackMultipliers: number[];
      eyeBurstBonusPerEnergy: number[];
      burstEnergyCost: number;
    })
  | (BaseDamageProfile & {
      kind: "nahida";
      triKarmaAtkMultipliers: number[];
      triKarmaEmMultipliers: number[];
    });

export type CharacterPreset = CharacterBase & {
  id: string;
  element: ElementKey;
  weaponType: WeaponType;
  defaultWeaponId: string;
  ascensionLabel: string;
  damageProfile?: CharacterDamageProfile;
};
