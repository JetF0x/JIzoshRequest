/**
 * Seeds src/data/metaTeams.json with example archetype teams: for each archetype,
 * a greedy search over recent units maximizes this site's grade under the
 * archetype's constraint. Hand-edit the JSON afterwards to add real community picks.
 *
 * Usage: npx tsx scripts/build-meta-teams.ts
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RumbleUnit } from '../src/types';
import { UNITS, sharesFamily, unitEffects } from '../src/lib/units';
import { rateTeam } from '../src/lib/rating';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/metaTeams.json');
const RECENT = UNITS.slice(0, 350);

const has = (attr: string, kind?: string) => (u: RumbleUnit) =>
  unitEffects(u).some((e) => (!kind || e.effect === kind) && e.attributes?.includes(attr));

interface Archetype {
  name: string;
  mode: 'attack' | 'defense';
  description: string;
  core: (u: RumbleUnit) => boolean; // units the archetype is built around
  coreCount: number;
  allow?: (u: RumbleUnit) => boolean; // restriction on every member
}

const ARCHETYPES: Archetype[] = [
  {
    name: 'Balanced all-rounder',
    mode: 'attack',
    description: 'The highest-graded mix of damage, sustain and control the checker finds among recent units.',
    core: () => true,
    coreCount: 0,
  },
  {
    name: 'Paralysis lock',
    mode: 'attack',
    description: 'Stacks Paralysis specials so the enemy spends the fight unable to act.',
    core: has('Paralysis', 'hinderance'),
    coreCount: 2,
  },
  {
    name: 'Silence control',
    mode: 'attack',
    description: 'Shuts down enemy specials with Silence, then wins on raw damage.',
    core: has('Silence', 'hinderance'),
    coreCount: 2,
  },
  {
    name: 'Healer stall',
    mode: 'defense',
    description: 'Two or more RCV/DEF-style units outlast attackers until the timer runs out.',
    core: (u) => u.style === 'RCV' || u.style === 'DEF',
    coreCount: 2,
  },
  {
    name: 'Provoke wall',
    mode: 'defense',
    description: 'A Provoke tank draws fire while debuffers grind the attackers down.',
    core: has('Provoke', 'boon'),
    coreCount: 1,
  },
  {
    name: 'STR rush',
    mode: 'attack',
    description: 'All-STR team so type-locked ATK buffs hit every member.',
    core: (u) => u.types.includes('STR'),
    coreCount: 5,
    allow: (u) => u.types.includes('STR'),
  },
  {
    name: 'PSY tempo',
    mode: 'attack',
    description: 'All-PSY team built around fast specials and shared buffs.',
    core: (u) => u.types.includes('PSY'),
    coreCount: 5,
    allow: (u) => u.types.includes('PSY'),
  },
];

function build(a: Archetype, used: Set<number>): RumbleUnit[] {
  const team: RumbleUnit[] = [];
  const free = (u: RumbleUnit) =>
    !team.some((m) => sharesFamily(m, u)) && (!a.allow || a.allow(u)) && !used.has(u.id);
  while (team.length < 5) {
    const needCore = team.filter(a.core).length < a.coreCount;
    let best: RumbleUnit | undefined;
    let bestScore = -1;
    for (const u of RECENT) {
      if (!free(u) || (needCore && !a.core(u))) continue;
      const s = rateTeam([...team, u]).overall;
      if (s > bestScore) [best, bestScore] = [u, s];
    }
    if (!best) break;
    team.push(best);
  }
  return team;
}

const used = new Set<number>(); // keep teams distinct from each other
const teams = ARCHETYPES.map((a) => {
  const team = build(a, used);
  team.slice(0, 2).forEach((u) => used.add(u.id));
  const r = rateTeam(team);
  console.log(`${r.grade} ${r.overall} ${a.name}: ${team.map((u) => u.name).join(' / ')}`);
  return { name: a.name, mode: a.mode, description: a.description, units: team.map((u) => u.id), source: 'example' };
});
await writeFile(OUT, JSON.stringify(teams, null, 2) + '\n');
