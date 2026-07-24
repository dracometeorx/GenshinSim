"use client";

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="关闭使用说明"
        >
          ×
        </button>
        <span className="modal-icon">✦</span>
        <h2 id="help-title">如何录入</h2>
        <ol>
          <li>在角色卡片中新建或切换方案；当前输入会自动保存在本机。</li>
          <li>选择角色、武器、精炼等级和圣遗物套装，并设置触发条件。</li>
          <li>把游戏内圣遗物详情页的绿色加成合计录入对应字段。</li>
          <li>按需填写战技、爆发等额外伤害加成。</li>
          <li>点击计算后，在结果区调整天赋等级、敌人等级与抗性。</li>
          <li>代表技能会同时显示未暴击、暴击和暴击期望伤害。</li>
        </ol>
        <div className="formula-box">
          技能伤害 = 技能基础值 × 增伤 × 防御倍率 × 抗性倍率 ×
          暴击/反应倍率
        </div>
        <button className="modal-primary" onClick={onClose}>
          开始录入
        </button>
      </section>
    </div>
  );
}
