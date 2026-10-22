import { Link, useNavigate, useParams } from 'react-router-dom';
import { getUnit } from '../lib/units';
import { gpConditionText, patternText, resilienceText, targetCriteriaText } from '../lib/effects';
import { decodeTeam, encodeTeam } from '../lib/teamCode';
import EffectList from '../components/EffectList';
import UnitThumb from '../components/UnitThumb';
import { StyleChip, TypeChips } from '../components/Chips';

export default function UnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u = getUnit(Number(id));
  if (!u)
    return (
      <section className="panel">
        <h1>Unit not found</h1>
        <Link to="/units">Back to units</Link>
      </section>
    );

  const addToTeam = () => {
    let saved = null;
    try {
      saved = localStorage.getItem('rumble-team-shop:last-team');
    } catch {
      // ignore
    }
    const team = decodeTeam(saved);
    if (!team.units.includes(u.id)) {
      const free = team.units.findIndex((x) => x == null);
      team.units[free >= 0 ? free : team.units.length - 1] = u.id;
    }
    navigate(`/builder?t=${encodeTeam(team)}`);
  };

  return (
    <section className="panel unit-detail">
      <div className="detail-head">
        <UnitThumb unit={u} size={96} />
        <div>
          <h1>{u.name}</h1>
          <p className="unit-meta">
            <StyleChip style={u.style} />
            <TypeChips unit={u} />
            {u.classes.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
            <span className="chip">{u.stars}★</span>
            <span className="muted small">ID {u.id}</span>
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={addToTeam}>
              Add to my team
            </button>
            <a className="btn ghost" href={`https://optc-db.github.io/characters/#/view/${Math.floor(u.id)}`} target="_blank" rel="noreferrer">
              View on OPTC-DB
            </a>
          </div>
        </div>
      </div>

      <div className="summary">
        {(
          [
            ['HP', u.hp],
            ['ATK', u.atk],
            ['RCV', u.rcv],
            ['DEF', u.def],
            ['SPD', u.spd],
            ['Special CT', `${u.special.cooldown ?? '–'}s`],
          ] as const
        ).map(([k, v]) => (
          <div className="stat" key={k}>
            <span>{k}</span>
            <strong>{typeof v === 'number' ? v.toLocaleString('en') : v}</strong>
          </div>
        ))}
      </div>

      <h2>Rumble Ability</h2>
      <EffectList effects={u.ability} />
      <h2>Rumble Special</h2>
      <EffectList effects={u.special.effects} />

      {u.gp && (
        <>
          <h2>GP Burst</h2>
          <p className="muted small">Activates: {u.gp.condition.map(gpConditionText).join(', ') || '–'}{u.gp.special.uses ? ` · ${u.gp.special.uses} uses` : ''}</p>
          <h3>GP Ability</h3>
          <EffectList effects={u.gp.ability} />
          <h3>GP Special</h3>
          <EffectList effects={u.gp.special.effects} />
        </>
      )}

      {u.llb && (
        <>
          <h2>Level Limit Break (LLB)</h2>
          <h3>Ability</h3>
          <EffectList effects={u.llb.ability} />
          <h3>Special{u.llb.special.cooldown ? ` (${u.llb.special.cooldown}s)` : ''}</h3>
          <EffectList effects={u.llb.special.effects} />
        </>
      )}

      <h2>Battle profile</h2>
      <ul className="effects">
        <li>Targets: {targetCriteriaText(u.target)}</li>
        <li>Action pattern: {u.pattern.map(patternText).join(' → ') || '–'}</li>
        {u.resilience.map((r, i) => (
          <li key={i}>Resilience: {resilienceText(r)}</li>
        ))}
        {u.llb?.resilience?.map((r, i) => (
          <li key={`l${i}`}>LLB resilience: {resilienceText(r)}</li>
        ))}
      </ul>
    </section>
  );
}
