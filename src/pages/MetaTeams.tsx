import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import metaTeams from '../data/metaTeams.json';
import type { RumbleUnit } from '../types';
import { getUnit } from '../lib/units';
import { rateTeam } from '../lib/rating';
import { emptyTeam, encodeTeam } from '../lib/teamCode';
import { shareUrl } from '../lib/useTeam';
import { GradeBadge } from '../components/Chips';
import TeamStrip from '../components/TeamStrip';
import CopyButton from '../components/CopyButton';

interface MetaTeam {
  name: string;
  mode: 'attack' | 'defense';
  description: string;
  units: number[];
  source?: string;
}

const MODES = ['all', 'attack', 'defense'] as const;

export default function MetaTeams() {
  const [mode, setMode] = useState<(typeof MODES)[number]>('all');
  const teams = useMemo(
    () =>
      (metaTeams as MetaTeam[]).map((t) => {
        const members = t.units.map((id) => getUnit(id)).filter((u): u is RumbleUnit => !!u);
        const team = { ...emptyTeam(), units: [...t.units, null, null, null, null, null].slice(0, 5) };
        return { ...t, team, rating: rateTeam(members) };
      }),
    [],
  );

  return (
    <section className="panel">
      <h1>Top Teams</h1>
      <p className="muted">
        Example archetypes built from recent units and graded by this site's checker. They're a starting point, not
        ladder data: to add community picks, edit <code>src/data/metaTeams.json</code>.
      </p>
      <div className="filter-row" role="tablist">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`chip toggle${mode === m ? ' on' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'all' ? 'All' : m === 'attack' ? 'Attack' : 'Defense'}
          </button>
        ))}
      </div>
      <div className="meta-list">
        {teams
          .filter((t) => mode === 'all' || t.mode === mode)
          .map((t) => (
            <article key={t.name} className="meta-card">
              <div className="meta-head">
                <GradeBadge grade={t.rating.grade} score={t.rating.overall} big />
                <div>
                  <h2>{t.name}</h2>
                  <span className={`chip mode-${t.mode}`}>{t.mode === 'attack' ? 'Attack' : 'Defense'}</span>
                  {t.source === 'example' && <span className="chip">Example</span>}
                </div>
              </div>
              <p>{t.description}</p>
              <TeamStrip ids={t.team.units} />
              <div className="cat-mini">
                {t.rating.categories.map((c) => (
                  <span key={c.key} title={`${c.label}: ${c.score}`}>
                    <GradeBadge grade={c.grade} /> {c.label}
                  </span>
                ))}
              </div>
              <div className="actions">
                <Link className="btn" to={`/builder?t=${encodeTeam(t.team)}`}>
                  Open in builder
                </Link>
                <CopyButton text={shareUrl(t.team)} />
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
