import { useEffect, useMemo, useState } from 'react';
import type { RumbleUnit } from '../types';
import { UNITS, filterUnits, sharesFamily, type UnitFilter } from '../lib/units';
import { sortUnits } from '../lib/sort';
import Filters, { type SortKey } from './Filters';
import UnitCard from './UnitCard';

interface Props {
  title: string;
  taken: RumbleUnit[];
  onPick: (u: RumbleUnit) => void;
  onClose: () => void;
}

const PAGE = 60;

export default function UnitPicker({ title, taken, onPick, onClose }: Props) {
  const [filter, setFilter] = useState<UnitFilter>({});
  const [sort, setSort] = useState<SortKey>('newest');
  const [limit, setLimit] = useState(PAGE);
  const results = useMemo(() => sortUnits(filterUnits(UNITS, filter), sort), [filter, sort]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => setLimit(PAGE), [filter, sort]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <Filters filter={filter} onChange={setFilter} sort={sort} onSort={setSort} />
        <p className="muted small">{results.length} units</p>
        <div className="unit-grid">
          {results.slice(0, limit).map((u) => {
            const clash = taken.find((t) => sharesFamily(t, u));
            return (
              <UnitCard
                key={u.id}
                unit={u}
                disabled={!!clash}
                note={clash ? `Same character as ${clash.name}` : undefined}
                onClick={() => onPick(u)}
              />
            );
          })}
        </div>
        {results.length > limit && (
          <button type="button" className="btn wide" onClick={() => setLimit(limit + PAGE)}>
            Show more
          </button>
        )}
      </div>
    </div>
  );
}
