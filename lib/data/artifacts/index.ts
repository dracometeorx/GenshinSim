import { blizzardStrayer } from "./blizzard-strayer.ts";
import { crimsonWitch } from "./crimson-witch.ts";
import { deepwood } from "./deepwood.ts";
import { emblem } from "./emblem.ts";
import { noArtifactSet } from "./none.ts";
import { shimenawa } from "./shimenawa.ts";
import { silkenMoonsSerenade } from "./silken-moons-serenade.ts";
import { nightOfSkysUnveiling } from "./night-of-skys-unveiling.ts";
import { aubadeOfMorningstarAndMoon } from "./aubade-of-morningstar-and-moon.ts";
import { aDayCarvedFromRisingWinds } from "./a-day-carved-from-rising-winds.ts";
import { celestialGift } from "./celestial-gift.ts";
import { tenacityOfTheMillelith } from "./tenacity-of-the-millelith.ts";
import { viridescentVenerer } from "./viridescent-venerer.ts";
import { delusionOfImmolatedShadow } from "./delusion-of-immolated-shadow.ts";
import { archaicPetra } from "./archaic-petra.ts";
import { instructor } from "./instructor.ts";
import { noblesseOblige } from "./noblesse-oblige.ts";
import { scrollOfTheHeroOfCinderCity } from "./scroll-of-the-hero-of-cinder-city.ts";
import { songOfDaysPast } from "./song-of-days-past.ts";
import { maidenBeloved } from "./maiden-beloved.ts";
import { theExile } from "./the-exile.ts";
import { scholar } from "./scholar.ts";
import type {
  ArtifactModifierContext,
  ArtifactModifier,
  ArtifactSetPreset,
} from "./types.ts";

export type {
  ArtifactEffectControl,
  ArtifactModifierContext,
  ArtifactModifier,
  ArtifactSetEffect,
  ArtifactSetPreset,
} from "./types.ts";

export const artifactSets: ArtifactSetPreset[] = [
  noArtifactSet,
  blizzardStrayer,
  crimsonWitch,
  shimenawa,
  emblem,
  deepwood,
  silkenMoonsSerenade,
  nightOfSkysUnveiling,
  aubadeOfMorningstarAndMoon,
  aDayCarvedFromRisingWinds,
  celestialGift,
  viridescentVenerer,
  tenacityOfTheMillelith,
  noblesseOblige,
  instructor,
  archaicPetra,
  scrollOfTheHeroOfCinderCity,
  songOfDaysPast,
  maidenBeloved,
  theExile,
  scholar,
  delusionOfImmolatedShadow,
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
  context?: Partial<ArtifactModifierContext>,
): ArtifactModifier[] {
  return resolveArtifactModifiers(
    getArtifactSet(artifactSetId),
    pieces,
    selections,
    true,
    context,
  );
}

export function resolveArtifactModifiers(
  artifactSet: ArtifactSetPreset,
  pieces: 0 | 2 | 4 | undefined,
  selections: Record<string, string> | undefined,
  includeConditional: boolean,
  context: Partial<ArtifactModifierContext> = {},
): ArtifactModifier[] {
  if (!pieces) return [];

  const resolvedContext: ArtifactModifierContext = {
    moonsignLevel: context.moonsignLevel ?? "none",
    witchHomeworkCompleted:
      context.witchHomeworkCompleted ?? false,
    hexereiSecretRite: context.hexereiSecretRite ?? false,
    characterElement: context.characterElement ?? "anemo",
    selections: selections ?? {},
  };
  const modifiers = [
    ...(artifactSet.twoPiece.modifiers ?? []),
    ...(artifactSet.twoPiece.evaluateModifiers?.(resolvedContext) ?? []),
  ];
  if (pieces !== 4) return modifiers;

  modifiers.push(...(artifactSet.fourPiece.modifiers ?? []));
  const control = artifactSet.fourPiece.control;
  if (!includeConditional) return modifiers;
  modifiers.push(
    ...(artifactSet.fourPiece.evaluateModifiers?.(resolvedContext) ?? []),
  );
  if (!control) return modifiers;

  const value = selections?.[control.key] ?? control.defaultValue;
  const option = control.options.find((item) => item.value === value);
  modifiers.push(...(option?.modifiers ?? []));
  return modifiers;
}
