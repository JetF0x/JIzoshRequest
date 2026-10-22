import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UNITS, filterUnits, type UnitFilter } from '../lib/units';
import { sortUnits } from '../lib/sort';
import Filters, { type SortKey } from '../components/Filters';
import UnitCard from '../components/UnitCard';

const PAGE = 90;

export default function Units() {
  const [filter, setFilter] = useState<UnitFilter>({});
  const [sort, setSort] = useState<SortKey>('newest');
  const [limit, setLimit] = useState(PAGE);
  const navigate = useNavigate();
  const results = useMemo(() => sortUnits(filterUnits(UNITS, filter), sort), [filter, sort]);

  return (
    <section className="panel">
      <h1>Units</h1>
      <p className="muted">Every unit with Pirate Rumble data, at max ability and special level.</p>
      <Filters
        filter={filter}
        onChange={(f) => {
          setFilter(f);
          setLimit(PAGE);
        }}
        sort={sort}
        onSort={setSort}
      />
      <p className="muted small">{results.length} units</p>
      <div className="unit-grid">
        {results.slice(0, limit).map((u) => (
          <UnitCard key={u.id} unit={u} onClick={() => navigate(`/units/${u.id}`)} />
        ))}
      </div>
      {results.length > limit && (
        <button type="button" className="btn wide" onClick={() => setLimit(limit + PAGE)}>
          Show more
        </button>
      )}
    </section>
  );
}
