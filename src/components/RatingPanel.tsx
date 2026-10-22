import { Link } from 'react-router-dom';
import type { TeamRating } from '../types';
import { getUnit } from '../lib/units';
import { GradeBadge } from './Chips';
import UnitThumb from './UnitThumb';

interface Props {
  rating: TeamRating;
  /** `replaceIndex` indexes the rated (non-empty) units; undefined means "fill an empty slot". */
  onUseSuggestion?: (id: number, replaceIndex?: number) => void;
  team?: { name: string }[];
}

export default function RatingPanel({ rating, onUseSuggestion, team }: Props) {
  return (
    <section className="panel rating" aria-label="Team rating">
      <div className="rating-head">
        <GradeBadge grade={rating.grade} score={rating.overall} big />
        <div>
          <h2>Team grade</h2>
          <p className="muted">{rating.overall}/100 overall</p>
        </div>
      </div>
      <ul className="cats">
        {rating.categories.map((c) => (
          <li key={c.key}>
            <div className="cat-line">
              <GradeBadge grade={c.grade} score={c.score} />
              <strong>{c.label}</strong>
              <span className="muted">{c.score}</span>
            </div>
            <div className="bar" aria-hidden>
              <span className={`fill grade-${c.grade}`} style={{ width: `${c.score}%` }} />
            </div>
            <p className="muted small">{c.notes.join(' · ')}</p>
          </li>
        ))}
      </ul>
      {rating.warnings.length > 0 && (
        <ul className="warnings">
          {rating.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
      {rating.suggestions.length > 0 && (
        <div className="suggestions">
          <h3>Suggestions</h3>
          {rating.suggestions.map((s, i) => (
            <div key={i} className="suggestion">
              <p>
                {s.text}
                {s.replaceIndex != null && team?.[s.replaceIndex] && (
                  <span className="muted small"> Swap out: {team[s.replaceIndex].name}</span>
                )}
              </p>
              <div className="sugg-units">
                {s.unitIds.map((id) => {
                  const u = getUnit(id);
                  if (!u) return null;
                  return (
                    <div key={id} className="sugg-unit">
                      <Link to={`/units/${id}`} title={u.name}>
                        <UnitThumb unit={u} size={48} />
                      </Link>
                      {onUseSuggestion && (
                        <button type="button" className="btn tiny" onClick={() => onUseSuggestion(id, s.replaceIndex)}>
                          Use
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
