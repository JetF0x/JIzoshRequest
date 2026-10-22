import { Link } from 'react-router-dom';
import { getUnit } from '../lib/units';
import UnitThumb from './UnitThumb';

export default function TeamStrip({ ids, size = 56 }: { ids: (number | null)[]; size?: number }) {
  return (
    <div className="team-strip">
      {ids.map((id, i) => {
        const u = getUnit(id);
        return u ? (
          <Link key={i} to={`/units/${u.id}`} title={u.name}>
            <UnitThumb unit={u} size={size} />
          </Link>
        ) : (
          <span key={i} className="thumb empty" style={{ width: size, height: size }} />
        );
      })}
    </div>
  );
}
