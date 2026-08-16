import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
} from "react";

/* ---------- contador animado ---------- */
export function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ---------- superfícies ---------- */
export function Card({
  children,
  className = "",
  hover = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`card ${hover ? "card-hover" : ""} anim-rise ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  right,
  className = "",
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        <div className="kicker mb-1.5">{kicker}</div>
        <h2 className="font-display text-[22px] font-semibold leading-tight text-snow sm:text-[26px]">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/* ---------- barras & anéis ---------- */
export function Bar({
  pct,
  color = "var(--color-brand)",
  h = 8,
  track = "rgba(0,255,104,0.08)",
  delay = 0,
}: {
  pct: number;
  color?: string;
  h?: number;
  track?: string;
  delay?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height: h, background: track }}>
      <div
        className="bar-grow h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color,
          animationDelay: `${delay}ms`,
          boxShadow: `0 0 10px ${color}44`,
        }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 148,
  stroke = 11,
  color = "var(--color-brand2)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = useCountUp(value, 1100);
  const off = c - (c * Math.min(100, Math.max(0, shown))) / 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,255,104,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.2s linear", filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- elementos pequenos ---------- */
export function Dot({ color, pulse = false, size = 9 }: { color: string; pulse?: boolean; size?: number }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${pulse && color === "#f0655f" ? "pulse-red" : ""} ${pulse && (color === "#38ff8a" || color === "#00ff68") ? "pulse-green" : ""}`}
      style={{ width: size, height: size, background: color, boxShadow: `0 0 8px ${color}55` }}
    />
  );
}

export function Chip({
  children,
  color = "#a5b0aa",
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${className}`}
      style={{
        color,
        background: `${color}14`,
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "solid",
  disabled = false,
  className = "",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wide";
  const sizes = size === "sm" ? "px-3.5 py-1.5 text-[10.5px]" : "px-5 py-2.5 text-[11.5px]";
  const variants = {
    solid:
      "bg-gradient-to-br from-[#00b947] to-[#00e85d] text-[#001b09] shadow-[0_0_20px_rgba(0,255,90,0.22)] hover:shadow-[0_0_30px_rgba(0,255,90,0.4)] hover:-translate-y-0.5",
    ghost: "border border-[rgba(0,255,104,0.35)] text-soft hover:bg-[rgba(0,255,104,0.07)] hover:shadow-[0_0_16px_rgba(0,255,90,0.15)]",
    danger: "border border-[rgba(240,101,95,0.4)] text-danger hover:bg-[rgba(240,101,95,0.1)]",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- formulários ---------- */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="kicker mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-[rgba(0,255,104,0.14)] bg-[#04140a]/80 px-3.5 py-2.5 text-[13px] text-snow outline-none transition-all placeholder:text-mist focus:border-[rgba(0,255,104,0.5)] focus:shadow-[0_0_18px_rgba(0,255,90,0.12)]";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} cursor-pointer ${props.className ?? ""}`} />;
}

export function ToggleChip({
  active,
  onClick,
  children,
  color = "#00ff68",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] transition-all duration-150 active:scale-95"
      style={{
        borderColor: active ? `${color}88` : "rgba(0,255,104,0.14)",
        color: active ? color : "var(--color-fog)",
        background: active ? `${color}14` : "transparent",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- cabeçalho de aba ---------- */
export function TabHeader({
  index,
  kicker,
  title,
  desc,
  right,
}: {
  index: string;
  kicker: string;
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="anim-rise mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="num mt-1 hidden rounded-full border border-[rgba(0,255,104,0.3)] bg-[rgba(0,255,104,0.07)] px-3 py-1.5 text-[12px] font-semibold text-brand2 shadow-[0_0_16px_rgba(0,255,90,0.12)] sm:block">
          {index}
        </div>
        <div>
          <div className="kicker mb-1">{kicker}</div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-snow sm:text-[36px]">
            {title}
          </h1>
          {desc && <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-fog">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
