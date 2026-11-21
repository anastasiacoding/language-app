import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const P: Record<string, string> = {
  back: '<path d="M15 6l-6 6 6 6"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  grammar: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  lang: '<path d="M4 5h8"/><path d="M8 3v2"/><path d="M5 9c1 4 4 6 7 7"/><path d="M11 5c-1 5-4 8-7 10"/><path d="M13 20l4-9 4 9"/><path d="M14.5 17h5"/>',
  chart: '<path d="M4 19h16"/><path d="M4 15l5-5 4 3 6-7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/>',
  speaker: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 3 1-2 1-4 1-7z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  shield: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M5 7h14"/><path d="M10 7V4h4v3"/><path d="M7 7l1 13h8l1-13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/>',
};

export function Icon({ name, size = 22, color = "currentColor", width = 1.8 }: { name: keyof typeof P | string; size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[name] ?? "" }} />
  );
}

export function Star({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "#A4161A" : "none"} stroke={on ? "#A4161A" : "#C5C8CC"} strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
    </svg>
  );
}

export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <div className="header">
      <button className="back" aria-label="Back" onClick={onBack ?? (() => nav(-1))}>
        <Icon name="back" size={24} />
      </button>
      <h2>{title}</h2>
      {right}
    </div>
  );
}

export function Seg<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: any) => void }) {
  return (
    <div className="seg" role="tablist">
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={value === i.id} className={value === i.id ? "on" : ""} onClick={() => onChange(i.id)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={"toggle" + (on ? " on" : "")} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function TabBar() {
  const tabs = [
    { to: "/", label: "Texts", icon: "book", end: true },
    { to: "/grammar", label: "Grammar", icon: "grammar" },
    { to: "/reference", label: "Reference", icon: "lang" },
    { to: "/progress", label: "Progress", icon: "chart" },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? "on" : "")}>
          <Icon name={t.icon} size={24} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const names = ["Reading", "Translation", "Retelling"];
  return (
    <div className="steps">
      {names.map((n, i) => (
        <span key={n} className={i + 1 === current ? "cur" : i + 1 < current ? "done" : ""}>
          {i + 1} · {n}
        </span>
      ))}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function Wave() {
  return (
    <div className="wave" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
