// 通用 flow 动画：粒子沿弧线流过 3 个节点
export function GenericFlowAnim() {
  return (
    <div className="relative h-40 flex items-center justify-around">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 160" preserveAspectRatio="none">
        <path d="M 40 80 Q 200 20 360 80" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
      </svg>
      {["输入", "变换", "输出"].map((label, i) => (
        <div
          key={i}
          className="relative z-10 h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-foreground animate-fade-in-up"
          style={{ animationDelay: `${i * 200}ms` }}
        >
          {label}
        </div>
      ))}
      {[0, 1].map(i => (
        <div
          key={`p${i}`}
          className="absolute h-2 w-2 rounded-full bg-foreground"
          style={{
            animation: `flow-x 2.2s ${i * 1.1}s infinite linear`,
            top: "40%",
            left: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes flow-x {
          0% { transform: translate(40px, 28px); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(200px, -18px); }
          90% { opacity: 1; }
          100% { transform: translate(360px, 28px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
