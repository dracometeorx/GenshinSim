"use client";

export type PlanDialogState =
  | { kind: "create"; value: string }
  | { kind: "rename"; value: string }
  | { kind: "delete"; value: string };

export function PlanDialog({
  dialog,
  onCancel,
  onConfirm,
  onValueChange,
}: {
  dialog: PlanDialogState;
  onCancel: () => void;
  onConfirm: () => void;
  onValueChange: (value: string) => void;
}) {
  const isDelete = dialog.kind === "delete";
  const title =
    dialog.kind === "create"
      ? "新建角色方案"
      : dialog.kind === "rename"
        ? "重命名方案"
        : "删除方案";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <form
        className="plan-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 id="plan-dialog-title">{title}</h2>
        {isDelete ? (
          <p>
            确定删除方案「<strong>{dialog.value}</strong>」吗？此操作无法撤销。
          </p>
        ) : (
          <label>
            <span>方案名称</span>
            <input
              autoFocus
              maxLength={80}
              value={dialog.value}
              onChange={(event) => onValueChange(event.target.value)}
            />
          </label>
        )}
        <div className="plan-dialog-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button
            className={isDelete ? "danger" : "primary"}
            type="submit"
            disabled={!isDelete && !dialog.value.trim()}
          >
            {isDelete ? "删除方案" : "确认"}
          </button>
        </div>
      </form>
    </div>
  );
}
