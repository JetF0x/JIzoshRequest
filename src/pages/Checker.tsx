import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RumbleUnit } from '../types';
import { UNITS, getUnit } from '../lib/units';
import { rateTeam } from '../lib/rating';
import { decodeTeam, encodeTeam } from '../lib/teamCode';
import RatingPanel from '../components/RatingPanel';
import TeamStrip from '../components/TeamStrip';
import TeamSummary from '../components/TeamSummary';

/** Accepts a full share link, a "?t=" fragment, a team code, or plain unit IDs. */
export function parseTeamInput(input: string) {
  const s = input.trim();
  const m = /[?&]t=([^&#\s]+)/.exec(s);
  if (m) return decodeTeam(decodeURIComponent(m[1]));
  if (/^[\d.\-~]+$/.test(s)) return decodeTeam(s);
  return decodeTeam(s.split(/[\s,;]+/).join('-'));
}

function lastTeamCode(): string {
  try {
    return localStorage.getItem('rumble-team-shop:last-team') ?? '';
  } catch {
    return '';
  }
}

export default function Checker() {
  const [input, setInput] = useState(lastTeamCode);
  const team = useMemo(() => parseTeamInput(input), [input]);
  const members = team.units.map((id) => getUnit(id)).filter((u): u is RumbleUnit => !!u);
  const rating = useMemo(() => rateTeam(members, UNITS), [team.units.join()]);

  return (
    <div className="builder">
      <section className="panel">
        <h1>Team Checker</h1>
        <p className="muted">
          Paste a share link, a team code or five unit IDs (e.g. <code>4987, 4986, 4985, 4984, 4983</code>) to get a
          grade and suggestions. Your last builder team is filled in already.
        </p>
        <textarea
          className="code-input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://…/#/builder?t=4987-4986-…"
          aria-label="Team link or code"
        />
        <TeamStrip ids={team.units} />
        <TeamSummary team={members} />
        {members.length > 0 && (
          <p>
            <Link className="btn" to={`/builder?t=${encodeTeam(team)}`}>
              Edit in builder
            </Link>
          </p>
        )}
      </section>
      {members.length > 0 ? (
        <RatingPanel rating={rating} team={members} />
      ) : (
        <section className="panel empty-state">
          <h2>No units recognised yet</h2>
          <p className="muted">
            Unit IDs are the numbers shown on each unit page. Build a team in the <Link to="/builder">builder</Link> to
            get a link.
          </p>
        </section>
      )}
    </div>
  );
}
