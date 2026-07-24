import type {
  ElementKey,
} from "../calculator.ts";
import type { TeamBuffDefinition } from "../team-types.ts";

export interface ElementalResonance {
  id: string;
  element: ElementKey;
  buffs: readonly TeamBuffDefinition[];
}

export const elementalResonances: readonly ElementalResonance[] = [
  {
    id: "fervent-flames",
    element: "pyro",
    buffs: [
      {
        id: "fervent-flames-attack",
        name: "热诚之火",
        description: "队伍中存在至少两名火元素角色，攻击力提高 25%。",
        evaluate: () => [
          { kind: "panel", stat: "atkPct", value: 25 },
        ],
      },
    ],
  },
  {
    id: "soothing-water",
    element: "hydro",
    buffs: [
      {
        id: "soothing-water-hp",
        name: "愈疗之水",
        description: "队伍中存在至少两名水元素角色，生命值上限提高 25%。",
        evaluate: () => [
          { kind: "panel", stat: "hpPct", value: 25 },
        ],
      },
    ],
  },
  {
    id: "shattering-ice",
    element: "cryo",
    buffs: [
      {
        id: "shattering-ice-crit-rate",
        name: "粉碎之冰",
        description:
          "队伍中存在至少两名冰元素角色；攻击冰元素影响或冻结敌人时暴击率提高 15%。",
        evaluate: () => [
          {
            kind: "damage",
            stat: "critRate",
            value: 15,
            reactions: ["none"],
          },
        ],
      },
    ],
  },
  {
    id: "enduring-rock",
    element: "geo",
    buffs: [
      {
        id: "enduring-rock-shielded",
        name: "坚定之岩",
        description:
          "队伍中存在至少两名岩元素角色；护盾保护下伤害提高 15%，并使敌人岩抗降低 20%。",
        evaluate: ({ target }) => [
          {
            kind: "damage",
            stat: "damageBonus",
            value: 15,
          },
          ...(target.element === "geo"
            ? [
                {
                  kind: "damage" as const,
                  stat: "enemyResistanceReduction" as const,
                  element: "geo" as const,
                  value: 20,
                },
              ]
            : []),
        ],
      },
    ],
  },
  {
    id: "sprawling-greenery",
    element: "dendro",
    buffs: [
      {
        id: "sprawling-greenery-base",
        name: "蔓生之草",
        description: "队伍中存在至少两名草元素角色，元素精通提高 50 点。",
        evaluate: () => [
          {
            kind: "panel",
            stat: "elementalMastery",
            value: 50,
          },
        ],
      },
      {
        id: "sprawling-greenery-primary",
        name: "蔓生之草·燃烧/激化/绽放",
        description:
          "触发燃烧、原激化或绽放后，元素精通进一步提高 30 点。",
        evaluate: () => [
          {
            kind: "panel",
            stat: "elementalMastery",
            value: 30,
          },
        ],
      },
      {
        id: "sprawling-greenery-secondary",
        name: "蔓生之草·进阶反应",
        description:
          "触发超激化、蔓激化、超绽放或烈绽放后，元素精通进一步提高 20 点。",
        evaluate: () => [
          {
            kind: "panel",
            stat: "elementalMastery",
            value: 20,
          },
        ],
      },
    ],
  },
];
