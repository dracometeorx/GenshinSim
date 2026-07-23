import { blizzardStrayer } from "./blizzard-strayer.ts";
import { crimsonWitch } from "./crimson-witch.ts";
import { deepwood } from "./deepwood.ts";
import { emblem } from "./emblem.ts";
import { noArtifactSet } from "./none.ts";
import type {
  ArtifactModifier,
  ArtifactSetPreset,
} from "./types.ts";

export type {
  ArtifactEffectControl,
  ArtifactModifier,
  ArtifactSetEffect,
  ArtifactSetPreset,
} from "./types.ts";

export const artifactSets: ArtifactSetPreset[] = [
  noArtifactSet,
  blizzardStrayer,
  crimsonWitch,
  emblem,
  deepwood,
];

export function getArtifactSet(
  artifactSetId: string | undefined,
): ArtifactSetPreset {
  return (
    artifactSets.find((artifactSet) => artifactSet.id === artifactSetId) ??
    noArtifactSet
  );
}

export function getArtifactModifiers(
  artifactSetId: string | undefined,
  pieces: 0 | 2 | 4 | undefined,
  selections: Record<string, string> | undefined,
): ArtifactModifier[] {
  if (!pieces) return [];

  const artifactSet = getArtifactSet(artifactSetId);
  const modifiers = [...(artifactSet.twoPiece.modifiers ?? [])];
  if (pieces !== 4) return modifiers;

  modifiers.push(...(artifactSet.fourPiece.modifiers ?? []));
  const control = artifactSet.fourPiece.control;
  if (!control) return modifiers;

  const value = selections?.[control.key] ?? control.defaultValue;
  const option = control.options.find((item) => item.value === value);
  modifiers.push(...(option?.modifiers ?? []));
  return modifiers;
}
