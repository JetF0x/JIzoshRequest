import { describe, expect, it } from 'vitest';
import { decodeTeam, encodeTeam, emptyTeam } from './teamCode';
import { effectText } from './effects';
import { gradeFor, rateTeam } from './rating';
import { UNITS, getUnit, sharesFamily } from './units';
import { resolveMaxLevel } from '../../scripts/import-optcdb';
import type { RumbleUnit } from '../types';

describe('teamCode', () => {
  it('round-trips main and support slots, including dual-unit ids', () => {
    const team = { units: [4987, null, 3134.1, 4900, null], supports: [null, 12, null, null, null] };
    expect(decodeTeam(encodeTeam(team))).toEqual(team);
  });
  it('omits supports when empty and tolerates junk', () => {
    expect(encodeTeam({ ...emptyTeam(), units: [1, 2, null, null, null] })).toBe('1-2---');
    expect(decodeTeam('abc-5~x').units).toEqual([null, 5, null, null, null]);
    expect(decodeTeam(null)).toEqual(emptyTeam());
  });
});

describe('import', () => {
  it('applies partial and empty overrides on top of earlier levels', () => {
    const r = resolveMaxLevel([
      { cooldown: 30, effects: [{ effect: 'buff', level: 1 }, { effect: 'debuff', level: 1 }] },
      { effects: [{ override: { level: 2 } }] },
      { effects: [{}, { override: { level: 3 } }] },
    ]);
    expect(r).toEqual({ cooldown: 30, effects: [{ effect: 'buff', level: 2 }, { effect: 'debuff', level: 3 }] });
  });
  it('produced unit 4987 with its max-level special', () => {
    const u = getUnit(4987)!;
    expect(u.style).toBe('ATK');
    expect(u.special.effects[0]).toMatchObject({ effect: 'hinderance', attributes: ['Paralysis'], chance: 80 });
  });
});

describe('effects', () => {
  it('renders readable text', () => {
    expect(
      effectText({
        effect: 'hinderance',
        attributes: ['Paralysis'],
        chance: 80,
        duration: 25,
        targeting: { targets: ['enemies'], count: 3 },
      }),
    ).toBe('80% chance to inflict Paralysis to 3 enemies for 25 seconds.');
    expect(
      effectText({
        effect: 'buff',
        attributes: ['ATK'],
        level: 5,
        targeting: { targets: ['[STR]', 'Slasher'] },
        condition: { type: 'time', comparator: 'first', count: 50 },
      }),
    ).toBe('For the first 50 seconds, Applies Lv.5 ATK up buff to STR and Slasher characters.');
  });
});

function pickTeam(pred: (u: RumbleUnit) => boolean, n = 5): RumbleUnit[] {
  const out: RumbleUnit[] = [];
  for (const u of UNITS) if (pred(u) && !out.some((m) => sharesFamily(m, u))) out.push(u);
  return out.slice(0, n);
}

describe('rating', () => {
  it('maps scores to grades', () => {
    expect([95, 80, 70, 55, 40, 10].map(gradeFor)).toEqual(['S', 'A', 'B', 'C', 'D', 'F']);
  });
  it('rates a mixed-role team above five attackers', () => {
    const atk = pickTeam((u) => u.style === 'ATK');
    const mixed = [
      ...pickTeam((u) => u.style === 'ATK', 2),
      ...pickTeam((u) => u.style === 'RCV', 1),
      ...pickTeam((u) => u.style === 'DBF', 1),
      ...pickTeam((u) => u.style === 'SPT', 1),
    ];
    const a = rateTeam(atk);
    const m = rateTeam(mixed);
    expect(m.overall).toBeGreaterThan(a.overall);
    expect(a.categories.find((c) => c.key === 'defense')!.score).toBeLessThan(
      m.categories.find((c) => c.key === 'defense')!.score,
    );
  });
  it('warns about duplicate characters and suggests fresh units', () => {
    const luffys = UNITS.filter((u) => u.family.includes('Monkey D. Luffy')).slice(0, 2);
    const r = rateTeam(luffys, UNITS);
    expect(r.warnings.some((w) => w.includes('twice'))).toBe(true);
    const ids = r.suggestions.flatMap((s) => s.unitIds);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(luffys.some((l) => sharesFamily(l, getUnit(id)!))).toBe(false);
  });
});
