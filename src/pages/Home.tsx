import { Link } from 'react-router-dom';
import { UNITS } from '../lib/units';
import TeamStrip from '../components/TeamStrip';

const TILES = [
  ['/builder', 'Team Builder', 'Fill 5 slots and 5 supports, see stats and synergies, and share a link.', '⚓'],
  ['/checker', 'Team Checker', 'Get S–F grades for offense, defense, control, synergy and versatility, plus swap ideas.', '🧭'],
  ['/units', 'Units', `Search ${UNITS.length.toLocaleString('en')} Rumble units by type, class, style and effect.`, '📜'],
  ['/meta', 'Top Teams', 'Browse attack and defense archetypes and copy them into the builder.', '🏴‍☠️'],
] as const;

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Build better Pirate Rumble teams</h1>
        <p>
          A Deck Shop–style toolkit for One Piece Treasure Cruise's Pirate Rumble: build a team, get it graded, and find
          the units that fix its weak spots.
        </p>
        <div className="actions">
          <Link className="btn big" to="/builder">
            Start building
          </Link>
          <Link className="btn ghost big" to="/meta">
            Browse top teams
          </Link>
        </div>
        <TeamStrip ids={UNITS.slice(0, 5).map((u) => u.id)} size={64} />
        <p className="muted small">Newest Rumble units in the database</p>
      </section>
      <section className="tiles">
        {TILES.map(([to, title, text, icon]) => (
          <Link key={to} to={to} className="tile">
            <span className="tile-icon" aria-hidden>
              {icon}
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
