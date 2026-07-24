import type { CharacterPreset } from "./types.ts";
import {
  directLunarModel,
  lunarBaseBonusFromDef,
  talentCurve,
} from "./lunar-common.ts";

const flyingHoofSecond = talentCurve(1.41);
const burstSecond = talentCurve(1.777);
const fullMoonFourth = talentCurve(0.295);

export const zibai: CharacterPreset = {
  id: "zibai",
  name: "兹白",
  level: 90,
  baseHp: 12919,
  baseAtk: 225,
  baseDef: 957,
  ascensionStat: "critDmg",
  ascensionValue: 38.4,
  ascensionLabel: "暴击伤害 +38.4%",
  element: "geo",
  weaponType: "sword",
  defaultWeaponId: "lightbearing-moonshard",
  burstEnergyCost: 60,
  moonsign: true,
  teamBuffs: [
    {
      id: "zibai-party-conversion",
      name: "叠嶂峦岫出云",
      description:
        "每名其他岩元素角色使兹白防御力提高 15%；每名其他水元素角色使元素精通提高 60。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: ({ party }) => {
        const otherGeo = Math.max(
          0,
          party.elements.filter((element) => element === "geo")
            .length - 1,
        );
        const hydro = party.elements.filter(
          (element) => element === "hydro",
        ).length;
        return [
          { kind: "panel", stat: "defPct", value: otherGeo * 15 },
          {
            kind: "panel",
            stat: "elementalMastery",
            value: hydro * 60,
          },
        ];
      },
    },
    {
      id: "zibai-lunar-blessing",
      name: "月兆祝赐·浮明若流",
      description:
        "每 100 点防御力使月结晶基础伤害提高 0.7%，至多 14%。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarBaseDamageBonus",
          value: lunarBaseBonusFromDef(source.panel.def),
          lunarReactions: ["lunarCrystallize"],
        },
      ],
    },
    {
      id: "zibai-c2-lunar-crystallize",
      name: "C2·化于生而死于尸",
      description:
        "月转时隙期间队伍月结晶伤害提高 30%。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: () => [
        {
          kind: "damage",
          stat: "lunarReactionDamageBonus",
          value: 30,
          lunarReactions: ["lunarCrystallize"],
        },
      ],
    },
  ],
  constellations: [
    {
      level: 1,
      name: "出勃然而入寥然",
      description: "首次灵驹飞踏第二段月结晶伤害提高 220%。",
    },
    {
      level: 2,
      name: "化于生而死于尸",
      description: "队伍月结晶提高 30%，满辉强化太阴降。",
    },
    {
      level: 3,
      name: "解天韬而堕其帙",
      description: "元素战技等级提高 3 级。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "魂魄往而身从之",
      description: "灵驹飞踏后强化第四段额外直伤。",
    },
    {
      level: 5,
      name: "明见无值至不论",
      description: "元素爆发等级提高 3 级。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "天地忽如一远行",
      description: "额外时隙浮光使月结晶伤害擢升。",
    },
  ],
  damageProfile: {
    kind: "zibai",
    talentLabel: "元素战技等级",
    controls: [
      {
        key: "zibaiFirstHoof",
        label: "灵驹飞踏状态",
        defaultValue: "first",
        options: [
          { value: "normal", label: "非首次" },
          { value: "first", label: "切换后首次（C1）" },
        ],
      },
      {
        key: "zibaiLumen",
        label: "C6 消耗时隙浮光",
        defaultValue: "100",
        options: [
          { value: "70", label: "70 点" },
          { value: "80", label: "80 点" },
          { value: "90", label: "90 点" },
          { value: "100", label: "100 点" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      moonsignLevel,
      panel,
      selection,
      settings,
      talentValue,
      percent,
    }) => {
      const skillMultiplier = talentValue(
        flyingHoofSecond,
        settings.skillTalentLevel,
      );
      const c2Additive =
        constellation >= 2 && moonsignLevel === "ascendant"
          ? panel.def * 5.5
          : 0;
      const lumen = Number(selection("zibaiLumen")) || 70;
      const c6Elevation =
        constellation >= 6
          ? Math.max(0, Math.min(30, lumen - 70)) * 1.6
          : 0;
      const targets = [
        {
          id: "zibai-flying-hoof",
          name: "灵驹飞踏·第二段",
          description:
            "技能第二段直伤月结晶，包含太阴降 60% 防御力基础伤害；不计算月笼谐奏。",
          multiplierLabel: `${percent(skillMultiplier)} 防御力 + 60% 防御力`,
          baseDamage: panel.def * skillMultiplier,
          category: "skill" as const,
          reactions: [],
          model: directLunarModel("lunarCrystallize"),
          extraLunarAdditiveBaseDamage:
            panel.def * 0.6 + c2Additive,
          extraLunarReactionDamageBonus:
            constellation >= 1 &&
            selection("zibaiFirstHoof") === "first"
              ? 220
              : 0,
          extraLunarElevation: c6Elevation,
        },
        {
          id: "zibai-burst-second",
          name: "三垣威仪法·第二段",
          description: "元素爆发第二段直接造成的月结晶伤害。",
          multiplierLabel: `${percent(
            talentValue(burstSecond, settings.burstTalentLevel),
          )} 防御力`,
          baseDamage:
            panel.def *
            talentValue(burstSecond, settings.burstTalentLevel),
          category: "burst" as const,
          reactions: [],
          model: directLunarModel("lunarCrystallize"),
          extraLunarElevation: c6Elevation,
        },
      ];
      if (moonsignLevel === "ascendant") {
        const normalMultiplier = talentValue(
          fullMoonFourth,
          settings.skillTalentLevel,
        );
        targets.push({
          id: "zibai-full-moon-fourth",
          name: "月转时隙·第四段追加",
          description: "月兆·满辉时第四段普通攻击的直伤月结晶。",
          multiplierLabel: `${percent(normalMultiplier)} 防御力`,
          baseDamage: panel.def * normalMultiplier,
          category: "normal",
          reactions: [],
          model: directLunarModel("lunarCrystallize"),
          extraLunarReactionDamageBonus:
            constellation >= 4 ? 150 : 0,
          extraLunarElevation: c6Elevation,
        });
      }
      return targets;
    },
  },
};
