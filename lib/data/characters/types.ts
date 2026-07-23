import type { CharacterBase, ElementKey } from "../../calculator.ts";

export type CharacterPreset = CharacterBase & {
  id: string;
  element: ElementKey;
  ascensionLabel: string;
};
