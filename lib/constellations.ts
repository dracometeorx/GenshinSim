import type { DamageSettings } from "./damage-types.ts";
import type { CharacterPreset } from "./data/characters/types.ts";

export function clampConstellation(value: unknown) {
  const numeric =
    typeof value === "number" ? value : Number(value);
  return Math.min(
    6,
    Math.max(0, Math.round(Number.isFinite(numeric) ? numeric : 0)),
  );
}

export function getUnlockedConstellations(
  character: CharacterPreset,
  constellation: number,
) {
  const level = clampConstellation(constellation);
  return (character.constellations ?? []).filter(
    (effect) => effect.level <= level,
  );
}

export function getConstellationCalculationState(
  character: CharacterPreset,
  constellation: number,
  settings: DamageSettings,
) {
  const unlocked = getUnlockedConstellations(
    character,
    constellation,
  );
  const talentLevelBonuses = unlocked.reduce(
    (result, effect) => ({
      normal:
        result.normal +
        (effect.talentLevelBonuses?.normal ?? 0),
      skill:
        result.skill + (effect.talentLevelBonuses?.skill ?? 0),
      burst:
        result.burst + (effect.talentLevelBonuses?.burst ?? 0),
    }),
    { normal: 0, skill: 0, burst: 0 },
  );

  return {
    panelEffects: unlocked.flatMap(
      (effect) => effect.panelEffects ?? [],
    ),
    damageEffects: unlocked.flatMap(
      (effect) => effect.damageEffects ?? [],
    ),
    settings: {
      ...settings,
      normalTalentLevel: Math.min(
        15,
        settings.normalTalentLevel + talentLevelBonuses.normal,
      ),
      skillTalentLevel: Math.min(
        15,
        settings.skillTalentLevel + talentLevelBonuses.skill,
      ),
      burstTalentLevel: Math.min(
        15,
        settings.burstTalentLevel + talentLevelBonuses.burst,
      ),
      selections: { ...settings.selections },
    },
  };
}
