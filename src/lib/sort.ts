import type { RumbleUnit } from '../types';
import type { SortKey } from '../components/Filters';

export function sortUnits(units: RumbleUnit[], key: SortKey): RumbleUnit[] {
  if (key === 'newest') return units;
  const by: Record<Exclude<SortKey, 'newest'>, (u: RumbleUnit) => number> = {
    spd: (u) => -u.spd,
    def: (u) => -u.def,
    atk: (u) => -u.atk,
    cooldown: (u) => u.special.cooldown ?? 99,
  };
  const f = by[key];
  return [...units].sort((a, b) => f(a) - f(b));
}
