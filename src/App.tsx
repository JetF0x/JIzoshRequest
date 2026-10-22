import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import Checker from './pages/Checker';
import Units from './pages/Units';
import UnitDetail from './pages/UnitDetail';
import MetaTeams from './pages/MetaTeams';

const NAV = [
  ['/builder', 'Team Builder'],
  ['/checker', 'Team Checker'],
  ['/units', 'Units'],
  ['/meta', 'Top Teams'],
] as const;

export default function App() {
  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">☠</span> Rumble Team Shop
        </NavLink>
        <nav>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/checker" element={<Checker />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units/:id" element={<UnitDetail />} />
          <Route path="/meta" element={<MetaTeams />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer>
        Unit data from the community{' '}
        <a href="https://optc-db.github.io" target="_blank" rel="noreferrer">
          OPTC Database
        </a>{' '}
        (GPL-3.0). Fan-made tool, not affiliated with Bandai Namco. Grades are heuristics, not simulations.
      </footer>
    </>
  );
}
