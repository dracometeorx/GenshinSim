import type { CharacterPreset } from "./types.ts";
import type {
  ElementKey,
  TalentBonuses,
} from "../../calculator.ts";
import type { LunarReactionType } from "../../damage-types.ts";
import {
  directLunarModel,
  talentCurve,
  talentValueAt,
} from "./lunar-common.ts";

const chargedInterference = talentCurve(0.047);
const bloomInterference = talentCurve(0.0141 * 5);
const crystallizeInterference = talentCurve(0.0882);

const lunarChoice: Record<
  string,
  {
    reaction: LunarReactionType;
    element: ElementKey;
    label: string;
    multipliers: readonly number[];
    c4HpMultiplier: number;
    category: keyof TalentBonuses;
  }
> = {
  lunarCharged: {
    reaction: "lunarCharged",
    element: "electro",
    label: "月感电",
    multipliers: chargedInterference,
    c4HpMultiplier: 0.125,
    category: "skill",
  },
  lunarBloom: {
    reaction: "lunarBloom",
    element: "dendro",
    label: "月绽放（5 枚合计）",
    multipliers: bloomInterference,
    c4HpMultiplier: 0.025,
    category: "skill",
  },
  lunarCrystallize: {
    reaction: "lunarCrystallize",
    element: "geo",
    label: "月结晶",
    multipliers: crystallizeInterference,
    c4HpMultiplier: 0.125,
    category: "skill",
  },
};

function constellationElevation(constellation: number) {
  const milestones = [
    { level: 1, value: 1.5 },
    { level: 2, value: 7 },
    { level: 3, value: 1.5 },
    { level: 4, value: 1.5 },
    { level: 5, value: 1.5 },
    { level: 6, value: 7 },
  ];
  return milestones.reduce(
    (total, item) =>
      constellation >= item.level ? total + item.value : total,
    0,
  );
}

function selectedInterference(settings: {
  selections: Record<string, string>;
}) {
  return (
    lunarChoice[
      settings.selections.columbinaInterference ?? "lunarCharged"
    ] ?? lunarChoice.lunarCharged
  );
}

export const columbina: CharacterPreset = {
  id: "columbina",
  name: "哥伦比娅",
  level: 90,
  baseHp: 14695,
  baseAtk: 96,
  baseDef: 515,
  ascensionStat: "critRate",
  ascensionValue: 19.2,
  ascensionLabel: "暴击率 +19.2%",
  element: "hydro",
  weaponType: "catalyst",
  defaultWeaponId: "nocturnes-curtain-call",
  burstEnergyCost: 60,
  moonsign: true,
  teamBuffs: [
    {
      id: "columbina-moon-madness",
      name: "月亮诱发的疯狂",
      description: "按引力干涉触发 3 次计算，自身暴击率提高 15%。",
      appliesToSelf: true,
      appliesToTeammates: false,
      evaluate: () => [
        { kind: "panel", stat: "critRate", value: 15 },
      ],
    },
    {
      id: "columbina-lunar-blessing",
      name: "月兆祝赐·借汝月光",
      description:
        "每 1000 点生命值使全部月曜反应基础伤害提高 0.2%，至多 7%。",
      appliesToSelf: true,
      evaluate: ({ source }) => {
        return [
          {
            kind: "damage",
            stat: "lunarBaseDamageBonus",
            value: Math.min(7, (source.panel.hp / 1000) * 0.2),
            lunarReactions: [
              "lunarCharged",
              "lunarBloom",
              "lunarCrystallize",
            ],
          },
        ];
      },
    },
    {
      id: "columbina-lunar-domain",
      name: "她的乡愁·月之领域",
      description: "月之领域提高队伍全部月曜反应伤害。",
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarReactionDamageBonus",
          value: talentValueAt(
            13,
            source.settings.burstTalentLevel,
          ),
          lunarReactions: [
            "lunarCharged",
            "lunarBloom",
            "lunarCrystallize",
          ],
        },
      ],
    },
    {
      id: "columbina-constellation-elevation",
      name: "哥伦比娅命座·月曜擢升",
      description:
        "各命座提供的队伍月曜反应擢升累计计算，C6 合计 20%。",
      minConstellation: 1,
      toggleable: false,
      appliesToSelf: true,
      evaluate: ({ source }) => [
        {
          kind: "damage",
          stat: "lunarElevation",
          value: constellationElevation(source.constellation),
          lunarReactions: [
            "lunarCharged",
            "lunarBloom",
            "lunarCrystallize",
          ],
        },
      ],
    },
    {
      id: "columbina-c2-radiance",
      name: "C2·皎辉·前台强化",
      description:
        "月兆·满辉时，按引力干涉类型提高前台角色的攻击力、元素精通或防御力。",
      minConstellation: 2,
      appliesToSelf: true,
      evaluate: ({ source, party }) => {
        if (party.moonsignLevel !== "ascendant") return [];
        const choice = selectedInterference(source.settings);
        if (choice.reaction === "lunarCharged") {
          return [{
            kind: "panel" as const,
            stat: "flatAtk" as const,
            value: source.panel.hp * 0.01,
          }];
        }
        if (choice.reaction === "lunarBloom") {
          return [{
            kind: "panel" as const,
            stat: "elementalMastery" as const,
            value: source.panel.hp * 0.0035,
          }];
        }
        return [{
          kind: "panel" as const,
          stat: "flatDef" as const,
          value: source.panel.hp * 0.01,
        }];
      },
    },
    {
      id: "columbina-c6-lunar-crit",
      name: "C6·夜昏且暗，且随月光",
      description:
        "月之领域中触发月曜反应后，对应参与元素暴击伤害提高 80%。",
      minConstellation: 6,
      appliesToSelf: true,
      evaluate: ({ source }) => {
        const choice = selectedInterference(source.settings);
        return [
          {
            kind: "damage",
            stat: "critDmg",
            value: 80,
            element: choice.element,
          },
        ];
      },
    },
  ],
  constellations: [
    {
      level: 1,
      name: "遍照花海，隐入群山",
      description: "施放战技立即触发引力干涉，并提供队伍擢升。",
    },
    {
      level: 2,
      name: "为夜增辉，与君遥伴",
      description: "获得皎辉生命加成，并按反应类型强化前台角色。",
      panelEffects: [
        {
          id: "columbina-c2-hp",
          stage: "additive",
          evaluate: () => [{ stat: "hpPct", value: 40 }],
        },
      ],
    },
    {
      level: 3,
      name: "柔光凝露，梦湖起波",
      description: "元素战技等级提高 3 级，并提供队伍擢升。",
      talentLevelBonuses: { skill: 3 },
    },
    {
      level: 4,
      name: "花岚云翳，山岩树影",
      description: "引力干涉获得额外生命倍率，并提供队伍擢升。",
    },
    {
      level: 5,
      name: "万籁俱寂，唯闻君唱",
      description: "元素爆发等级提高 3 级，并提供队伍擢升。",
      talentLevelBonuses: { burst: 3 },
    },
    {
      level: 6,
      name: "夜昏且暗，且随月光",
      description: "对应元素暴伤提高 80%，并提供队伍擢升。",
    },
  ],
  damageProfile: {
    kind: "columbina",
    talentLabel: "元素战技等级",
    controls: [
      {
        key: "columbinaInterference",
        label: "引力干涉类型",
        defaultValue: "lunarCharged",
        options: [
          { value: "lunarCharged", label: "月感电" },
          { value: "lunarBloom", label: "月绽放" },
          { value: "lunarCrystallize", label: "月结晶" },
        ],
      },
    ],
    evaluateTargets: ({
      constellation,
      panel,
      selection,
      settings,
      talentValue,
      percent,
    }) => {
      const choice =
        lunarChoice[selection("columbinaInterference")] ??
        lunarChoice.lunarCharged;
      const multiplier = talentValue(
        choice.multipliers,
        settings.skillTalentLevel,
      );
      return [
        {
          id: "columbina-interference",
          name: `引力干涉·${choice.label}`,
          description:
            "只计算引力干涉由技能直接造成的月曜伤害；不计算雷暴云、诳言之核或月笼攻击。",
          multiplierLabel: `${percent(multiplier)} 生命值上限`,
          baseDamage: panel.hp * multiplier,
          category: choice.category,
          reactions: [],
          model: directLunarModel(choice.reaction),
          damageElement: choice.element,
          extraLunarAdditiveBaseDamage:
            constellation >= 4
              ? panel.hp * choice.c4HpMultiplier
              : 0,
        },
      ];
    },
  },
};
