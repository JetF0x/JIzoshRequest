import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RumbleUnit, Team } from '../types';
import { UNITS, getUnit } from '../lib/units';
import { rateTeam } from '../lib/rating';
import { emptyTeam } from '../lib/teamCode';
import { shareUrl, useTeam } from '../lib/useTeam';
import UnitPicker from '../components/UnitPicker';
import UnitThumb from '../components/UnitThumb';
import RatingPanel from '../components/RatingPanel';
import TeamSummary from '../components/TeamSummary';
import CopyButton from '../components/CopyButton';
import { StyleChip } from '../components/Chips';

type SlotRef = { list: keyof Team; index: number };

export default function Builder() {
  const [team, setTeam] = useTeam();
  const [picking, setPicking] = useState<SlotRef | null>(null);

  const main = team.units.map((id) => getUnit(id) ?? null);
  const supports = team.supports.map((id) => getUnit(id) ?? null);
  const members = main.filter((u): u is RumbleUnit => !!u);
  // Indexes of filled main slots, so rating indexes map back onto slots.
  const filled = team.units.flatMap((id, i) => (getUnit(id) ? [i] : []));
  const rating = useMemo(() => rateTeam(members, UNITS), [team.units.join()]);

  const setSlot = (ref: SlotRef, id: number | null) => {
    const list = [...team[ref.list]];
    list[ref.index] = id;
    setTeam({ ...team, [ref.list]: list });
  };

  const applySuggestion = (id: number, replaceIndex?: number) => {
    const slot = replaceIndex != null ? filled[replaceIndex] : team.units.findIndex((x) => !getUnit(x));
    if (slot >= 0) setSlot({ list: 'units', index: slot }, id);
  };

  const taken = (ref: SlotRef) =>
    [...main, ...supports].filter((u, i): u is RumbleUnit => {
      const self = ref.list === 'units' ? i === ref.index : i === main.length + ref.index;
      return !!u && !self;
    });

  const slot = (u: RumbleUnit | null, ref: SlotRef, label: string) => (
    <div className={`slot${u ? ' filled' : ''}`} key={`${ref.list}${ref.index}`}>
      <button type="button" className="slot-btn" onClick={() => setPicking(ref)} aria-label={`${label}: ${u?.name ?? 'empty'}`}>
        {u ? <UnitThumb unit={u} size={72} /> : <span className="plus">+</span>}
      </button>
      <span className="slot-label">{label}</span>
      {u && (
        <>
          <Link to={`/units/${u.id}`} className="slot-name" title={u.name}>
            {u.name}
          </Link>
          <StyleChip style={u.style} />
          <button type="button" className="link small" onClick={() => setSlot(ref, null)}>
            Remove
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="builder">
      <section className="panel">
        <div className="panel-head">
          <h1>Team Builder</h1>
          <div className="actions">
            <CopyButton text={shareUrl(team)} />
            <button type="button" className="btn ghost" onClick={() => setTeam(emptyTeam())}>
              Clear
            </button>
          </div>
        </div>
        <div className="slots">{main.map((u, i) => slot(u, { list: 'units', index: i }, i === 0 ? 'Leader' : `Slot ${i + 1}`))}</div>
        <h3>Supports</h3>
        <p className="muted small">Shown and shared with the team, but not part of the grade.</p>
        <div className="slots supports">
          {supports.map((u, i) => slot(u, { list: 'supports', index: i }, `Support ${i + 1}`))}
        </div>
        <TeamSummary team={members} />
      </section>

      {members.length > 0 ? (
        <RatingPanel rating={rating} onUseSuggestion={applySuggestion} team={members} />
      ) : (
        <section className="panel empty-state">
          <h2>Pick your first unit</h2>
          <p className="muted">Tap a slot to add a unit, or start from one of the <Link to="/meta">top teams</Link>.</p>
        </section>
      )}

      {picking && (
        <UnitPicker
          title={picking.list === 'units' ? `Choose ${picking.index === 0 ? 'leader' : `slot ${picking.index + 1}`}` : `Choose support ${picking.index + 1}`}
          taken={taken(picking)}
          onPick={(u) => {
            setSlot(picking, u.id);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}
