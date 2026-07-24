"use client";

import type { BuildPlan } from "../../lib/build-plans";

export function BuildPlanManager({
  activePlanId,
  hydrated,
  plans,
  onChoose,
  onCreate,
  onRename,
  onDelete,
}: {
  activePlanId: string;
  hydrated: boolean;
  plans: BuildPlan[];
  onChoose: (id: string) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="plan-picker">
      <label>
        <span>角色方案</span>
        <select
          aria-label="选择角色方案"
          value={activePlanId}
          disabled={!hydrated || plans.length === 0}
          onChange={(event) => onChoose(event.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>
      <div className="plan-actions" aria-label="方案操作">
        <button
          type="button"
          onClick={onCreate}
          disabled={!hydrated}
          title="复制当前配置为新方案"
        >
          ＋ 新建
        </button>
        <button
          type="button"
          onClick={onRename}
          disabled={!hydrated}
          title="重命名当前方案"
        >
          重命名
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!hydrated || plans.length <= 1}
          title={plans.length <= 1 ? "至少保留一个方案" : "删除当前方案"}
        >
          删除
        </button>
      </div>
    </div>
  );
}
