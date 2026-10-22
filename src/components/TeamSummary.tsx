import type { RumbleUnit } from '../types';
import { StyleChip } from './Chips';

const count = (xs: string[]) =>
  Object.entries(xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})).sort(
    (a, b) => b[1] - a[1],
  );

export default function TeamSummary({ team }: { team: RumbleUnit[] }) {
  if (!team.length) return null;
  const avg = (f: (u: RumbleUnit) => number) => Math.round(team.reduce((s, u) => s + f(u), 0) / team.length);
  return (
    <div className="summary">
      <div className="stat">
        <span>Avg SPD</span>
        <strong>{avg((u) => u.spd)}</strong>
      </div>
      <div className="stat">
        <span>Avg DEF</span>
        <strong>{avg((u) => u.def)}</strong>
      </div>
      <div className="stat">
        <span>Avg special CT</span>
        <strong>{avg((u) => u.special.cooldown ?? 0)}s</strong>
      </div>
      <div className="stat">
        <span>Total HP</span>
        <strong>{team.reduce((s, u) => s + u.hp, 0).toLocaleString('en')}</strong>
      </div>
      <div className="dist">
        {count(team.map((u) => u.style)).map(([s, n]) => (
          <span key={s}>
            <StyleChip style={s} /> ×{n}
          </span>
        ))}
      </div>
      <div className="dist">
        {count(team.flatMap((u) => u.types)).map(([t, n]) => (
          <span key={t} className={`chip type t-${t}`}>
            {t} ×{n}
          </span>
        ))}
        {count(team.flatMap((u) => u.classes)).map(([c, n]) => (
          <span key={c} className="chip">
            {c} ×{n}
          </span>
        ))}
      </div>
    </div>
  );
}
