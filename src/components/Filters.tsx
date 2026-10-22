import { CLASSES, RUMBLE_STYLES, UNIT_TYPES } from '../types';
import { TARGET_CRITERIA, type UnitFilter } from '../lib/units';

export type SortKey = 'newest' | 'spd' | 'def' | 'cooldown' | 'atk';

export const KEYWORDS = [
  'Paralysis',
  'Silence',
  'Provoke',
  'ATK down',
  'DEF down',
  'SPD down',
  'Special CT',
  'Restores',
  'cleanse',
  'Revive',
  'Counter',
  'Damage Over Time',
  'health cut',
  'Critical Hit',
  'Guard',
];

interface Props {
  filter: UnitFilter;
  onChange: (f: UnitFilter) => void;
  sort?: SortKey;
  onSort?: (s: SortKey) => void;
}

function toggle(list: string[] | undefined, v: string) {
  const l = list ?? [];
  return l.includes(v) ? l.filter((x) => x !== v) : [...l, v];
}

export default function Filters({ filter, onChange, sort, onSort }: Props) {
  const set = (patch: Partial<UnitFilter>) => onChange({ ...filter, ...patch });
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search units or characters…"
        value={filter.query ?? ''}
        onChange={(e) => set({ query: e.target.value })}
        aria-label="Search units"
      />
      <div className="filter-row" role="group" aria-label="Type">
        {UNIT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip toggle type t-${t}${filter.types?.includes(t) ? ' on' : ''}`}
            onClick={() => set({ types: toggle(filter.types, t) })}
          >
            {t}
          </button>
        ))}
        <span className="sep" />
        {RUMBLE_STYLES.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip toggle style-${s}${filter.styles?.includes(s) ? ' on' : ''}`}
            onClick={() => set({ styles: toggle(filter.styles, s) })}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Class">
        {CLASSES.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip toggle${filter.classes?.includes(c) ? ' on' : ''}`}
            onClick={() => set({ classes: toggle(filter.classes, c) })}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="filter-row selects">
        <label>
          Effect
          <select value={filter.keyword ?? ''} onChange={(e) => set({ keyword: e.target.value || undefined })}>
            <option value="">Any</option>
            {KEYWORDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Targets
          <select value={filter.criteria ?? ''} onChange={(e) => set({ criteria: e.target.value || undefined })}>
            <option value="">Any</option>
            {TARGET_CRITERIA.map((c) => (
              <option key={c} value={c}>
                {c === 'near' ? 'Nearby' : c}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={!!filter.gp} onChange={(e) => set({ gp: e.target.checked })} /> GP
        </label>
        <label className="check">
          <input type="checkbox" checked={!!filter.llb} onChange={(e) => set({ llb: e.target.checked })} /> LLB
        </label>
        {onSort && (
          <label>
            Sort
            <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
              <option value="newest">Newest</option>
              <option value="spd">SPD</option>
              <option value="def">DEF</option>
              <option value="atk">ATK</option>
              <option value="cooldown">Fastest special</option>
            </select>
          </label>
        )}
        <button type="button" className="link" onClick={() => onChange({})}>
          Clear
        </button>
      </div>
    </div>
  );
}
