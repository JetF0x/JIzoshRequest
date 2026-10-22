import data from '../data/units.json';
import type { Effect, RumbleUnit } from '../types';
import { effectText } from './effects';

export const UNITS = data as RumbleUnit[];
export const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));

export const getUnit = (id: number | null | undefined) => (id == null ? undefined : UNIT_BY_ID.get(id));

export const thumbnailUrl = (u: Pick<RumbleUnit, 'thumb'>) => `https://optc-db.github.io/api/images/${u.thumb}`;

/** Every effect a unit can bring: ability, special and (optionally) GP kit. */
export function unitEffects(u: RumbleUnit, { gp = true } = {}): Effect[] {
  return [...u.ability, ...u.special.effects, ...(gp && u.gp ? [...u.gp.ability, ...u.gp.special.effects] : [])];
}

/** Two units clash when they belong to the same character family. */
export function sharesFamily(a: RumbleUnit, b: RumbleUnit): boolean {
  return a.family.some((f) => b.family.includes(f));
}

// Lower-cased text of everything a unit does, for the keyword filter.
const searchText = new Map<number, string>();
export function unitSearchText(u: RumbleUnit): string {
  let s = searchText.get(u.id);
  if (!s) {
    const effects = [...unitEffects(u), ...(u.llb ? [...u.llb.ability, ...u.llb.special.effects] : [])];
    s = [u.name, ...u.family, ...u.classes, ...u.types, u.style, ...effects.map(effectText)]
      .join(' ')
      .toLowerCase();
    searchText.set(u.id, s);
  }
  return s;
}

export interface UnitFilter {
  query?: string;
  types?: string[];
  classes?: string[];
  styles?: string[];
  keyword?: string;
  criteria?: string;
  gp?: boolean;
  llb?: boolean;
}

export function filterUnits(units: RumbleUnit[], f: UnitFilter): RumbleUnit[] {
  const q = f.query?.trim().toLowerCase();
  const kw = f.keyword?.trim().toLowerCase();
  return units.filter(
    (u) =>
      (!q || u.name.toLowerCase().includes(q) || u.family.some((x) => x.toLowerCase().includes(q))) &&
      (!f.types?.length || u.types.some((t) => f.types!.includes(t))) &&
      (!f.classes?.length || f.classes.every((c) => u.classes.includes(c))) &&
      (!f.styles?.length || f.styles.includes(u.style)) &&
      (!f.criteria || `${u.target.comparator ?? ''} ${u.target.criteria}`.trim() === f.criteria) &&
      (!f.gp || !!u.gp) &&
      (!f.llb || !!u.llb) &&
      (!kw || unitSearchText(u).includes(kw)),
  );
}

export const TARGET_CRITERIA = [...new Set(UNITS.map((u) => `${u.target.comparator ?? ''} ${u.target.criteria}`.trim()))];
