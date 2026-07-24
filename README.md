# 原神伤害计算器

一个面向单角色、单目标的原神面板与代表技能伤害计算器。输入角色、武器、圣遗物合计属性和战斗条件后，页面会实时派生最终面板、未暴击/暴击/期望伤害，以及防御和抗性倍率。

> 本项目是社区工具，与米哈游 / HoYoverse 无关联。结果用于配装比较，不替代游戏内实测。

## 当前支持范围

- 角色：神里绫华、胡桃、雷电将军、纳西妲，以及仅计算面板的自定义角色。
- 武器：雾切之回光、护摩之杖、薙草之稻光、千夜浮梦和自定义武器。
- 圣遗物：冰风迷途的勇士、炽烈的炎之魔女、绝缘之旗印、深林的记忆。
- 精炼：雾切、护摩、薙草均支持 1–5 阶。
- 反应：蒸发、融化和蔓激化；同一技能同时给出不反应结果。
- 方案：按角色隔离的多个本地方案，可新建、重命名、切换、删除和重置。

本阶段不计算队伍轮转、队友增益、命座、元素附着时间轴、多目标或敌人防御降低。代表技能不是完整循环模拟。

## 计算约定

统一入口 `calculateBuild(request)` 接收方案输入、已解析角色预设和敌人设置，并返回：

- 最终角色面板；
- 代表技能的各反应伤害；
- 防御倍率、有效抗性与抗性倍率；
- 条件冲突或输入归一化警告。

页面、复制数据和系统分享均使用同一个 `CalculationResult`，不会各自重复计算。

主要公式：

```text
基础技能伤害 = 技能倍率 × 对应属性 + 激化附加值
最终伤害 = 基础技能伤害 × (1 + 分类增伤) × 防御倍率 × 抗性倍率 × 反应倍率
暴击期望 = 最终伤害 × (1 + 暴击率 × 暴击伤害)
蔓激化附加值 = 1.25 × 角色等级系数 × (1 + 精通增益)
```

实现参考：

- [KQM Theorycrafting Library：伤害公式](https://library.keqingmains.com/combat-mechanics/damage/damage-formula)
- [Genshin Impact Wiki：等级/反应系数](https://genshin-impact.fandom.com/wiki/Level_Scaling/Reaction)
- [炽烈的炎之魔女](https://genshin-impact.fandom.com/zh/wiki/%E7%86%BE%E7%83%88%E7%9A%84%E7%82%8E%E4%B9%8B%E9%AD%94%E5%A5%B3?variant=zh-hans)

代码会把表外角色等级钳制到 1–90 级的反应系数范围。互斥条件不会静默混用：例如冰套的“冻结敌人”暴击率不会用于融化期望，结果区会显示警告。

## 数据录入

圣遗物字段填写游戏内角色详情页中圣遗物提供的绿色合计值：

- 生命、攻击、防御填写固定值；
- 暴击、暴伤、充能、元素伤害和治疗加成填写百分数本身，例如 `46.6`；
- 元素精通填写固定值；
- “额外伤害加成”按普攻、重击、下落攻击、战技和爆发分类填写。

数字输入允许先清空、输入负数或停留在 `1.` 等编辑状态；失焦或按 Enter 后才解析并钳制。敌人抗性允许负数。

## 方案存储

方案保存在浏览器 `localStorage`，当前键名为 `genshin-build-plans-v2`，数据版本为 v2。

- 快照只保存目录 ID 和用户输入，恢复时重新读取当前角色、武器和套装预设。
- v1 全局方案会迁移为按角色隔离的 v2 方案。
- 更早的单方案存档键（v1–v6）会尽力迁移。
- 未知目录 ID、非法条件值和越界数字会回退或钳制到合法值。
- 损坏 JSON 会被忽略并使用默认方案。

本项目没有数据库或账号同步。浏览器拒绝 localStorage、剪贴板或分享操作时，页面会显示可见提示。

## 代码结构

```text
app/
  page.tsx                         页面布局与组合
  components/                     方案、选择、输入、结果、帮助 UI
  hooks/use-build-plans.ts        reducer、hydration 与单一持久化 effect
lib/
  calculation.ts                  统一计算入口
  calculator.ts                   面板与分阶段 modifier
  damage.ts                       代表技能、反应、防御与抗性
  build-plans.ts                  v2 持久化格式
  build-plan-runtime.ts           目录恢复、迁移与输入归一化
  data/                            角色、武器、圣遗物声明式目录
tests/                             公式、目录、迁移、reducer 与 UI 工具测试
```

简单武器和套装效果通过声明式 modifier/effect 表达。胡桃、雷电将军、神里绫华和纳西妲的动态技能机制由 `damage.ts` 中的 typed evaluator 注册表处理。

## 新增角色、武器或套装

新增角色：

1. 在 `lib/data/characters/` 添加角色基础属性、武器类型、默认武器和技能倍率。
2. 在 `lib/data/characters/index.ts` 注册预设。
3. 若需要动态技能机制，为 `CharacterDamageProfile` 增加有判别字段的类型，并在 evaluator 注册表实现代表技能。
4. 添加目录唯一性、面板与黄金伤害测试。

新增武器：

1. 在 `lib/data/weapons/` 添加基础属性、精炼描述、条件控件和声明式 `effect`。
2. 在 `lib/data/weapons/index.ts` 注册预设。
3. 只有确实无法声明表达的机制才扩展 typed effect union。
4. 对 1–5 阶添加表驱动测试，并验证恢复时的精炼钳制。

新增套装：

1. 在 `lib/data/artifacts/` 使用 `stat`、`damageBonus`、`reactionBonus`、`enemyResistanceReduction` 等分阶段 modifier 描述效果。
2. 在 `lib/data/artifacts/index.ts` 注册预设。
3. 条件值必须在恢复阶段归一化，并补充面板与伤害层测试。

## 本地开发与验收

要求 Node.js `>=22.13.0`。

```bash
npm run dev
npm run lint
npm test
```

`npm test` 会执行完整 Vinext/Sites 构建、产物校验和核心测试。在 Linux/Sites 环境使用 GNU `timeout` 限制构建时间；macOS 未安装 GNU `timeout` 时仍可直接完成本地构建。

部署配置位于 `.openai/hosting.json`。项目保留 Vinext 与 Sites 生命周期，不启用 starter 中预留的数据库和认证模板。
