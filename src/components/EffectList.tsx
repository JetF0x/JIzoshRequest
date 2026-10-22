import type { Effect } from '../types';
import { effectText } from '../lib/effects';

export default function EffectList({ effects }: { effects: Effect[] }) {
  if (!effects.length) return <p className="muted">None</p>;
  return (
    <ul className="effects">
      {effects.map((e, i) => (
        <li key={i} className={`eff eff-${e.effect}`}>
          {effectText(e)}
        </li>
      ))}
    </ul>
  );
}
