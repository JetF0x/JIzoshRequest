// Deck Shop–style team checker. All scores are heuristics over the effect data:
// they reward role coverage and buffs that actually reach the team, not exact
// battle simulation.
import type { CategoryScore, Effect, Grade, RumbleUnit, Suggestion, TeamRating } from '../types';
import { sharesFamily, unitEffects } from './units';

export const TEAM_SIZE = 5;

const OFFENSE_ATTRS = ['ATK', 'Critical Hit', 'SPD', 'Accuracy', 'Special CT', 'Blow Away'];
const DEFENSE_ATTRS = ['DEF', 'HP', 'Guard', 'RCV', 'Shield'];
const DEFENSE_BOONS = ['Provoke', 'Counter', 'Revive', 'Shield', 'Paralysis', 'Silence', 'Action Bind'];

const sat = (x: number, k: number) => 1 - Math.exp(-x / k); // 0..1, diminishing returns
const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
const lv = (e: Effect) => (e.level ?? 3) / 5;
const pct = (e: Effect) => (e.chance ?? 100) / 100;

export function gradeFor(score: number): Grade {
  if (score >= 90) return 'S';
  if (score >= 78) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

const targetsEnemies = (e: Effect) => !!e.targeting?.targets.includes('enemies');
const hits = (e: Effect, attrs: string[]) => !!e.attributes?.some((a) => attrs.includes(a));

/** Does an ally-targeted effect reach this unit? `[STR]` tags are types, other tags are classes. */
function reaches(e: Effect, u: RumbleUnit, self: RumbleUnit): boolean {
  const t = e.targeting?.targets ?? ['self'];
  if (t.includes('self')) return u === self;
  if (t.includes('crew')) return !(e.targeting?.excludes?.includes('self') && u === self);
  return t.some((tag) => {
    const m = /^\[(\w+)\]$/.exec(tag);
    return m ? u.types.includes(m[1] as RumbleUnit['types'][number]) : u.classes.includes(tag);
  });
}

const isRestricted = (e: Effect) =>
  !targetsEnemies(e) && !!e.targeting && !e.targeting.targets.some((t) => t === 'crew' || t === 'self');

interface Features {
  styles: Record<string, number>;
  offenseBuff: number;
  defenseBuff: number;
  damage: number;
  heal: number;
  debuff: number;
  hinder: number;
  cleanse: number;
  resilience: number;
  restrictedReach: number[]; // per restricted buff: fraction of team it reaches
  familyHits: number;
  familyConds: number;
  spd: number;
  def: number;
  cooldown: number;
  criteria: number;
}

function features(team: RumbleUnit[]): Features {
  const f: Features = {
    styles: {},
    offenseBuff: 0,
    defenseBuff: 0,
    damage: 0,
    heal: 0,
    debuff: 0,
    hinder: 0,
    cleanse: 0,
    resilience: 0,
    restrictedReach: [],
    familyHits: 0,
    familyConds: 0,
    spd: 0,
    def: 0,
    cooldown: 0,
    criteria: new Set(team.map((u) => `${u.target.comparator} ${u.target.criteria}`)).size,
  };
  const n = team.length || 1;
  for (const u of team) {
    f.styles[u.style] = (f.styles[u.style] ?? 0) + 1;
    f.spd += u.spd / n;
    f.def += u.def / n;
    f.cooldown += (u.special.cooldown ?? 40) / n;
    f.heal += u.pattern.filter((p) => p.action === 'heal').length * 0.25;
    f.resilience += u.resilience.length * 0.5;
    for (const e of unitEffects(u)) {
      // Ally buffs are worth more when they reach more of the team.
      const reach = targetsEnemies(e) ? 1 : team.filter((m) => reaches(e, m, u)).length / n;
      if (isRestricted(e)) f.restrictedReach.push(reach);
      if (e.condition?.type === 'character') {
        f.familyConds++;
        if (e.condition.team !== 'enemies' && team.some((m) => m.family.some((x) => e.condition!.families?.includes(x))))
          f.familyHits++;
      }
      switch (e.effect) {
        case 'buff':
          if (hits(e, OFFENSE_ATTRS)) f.offenseBuff += lv(e) * reach * 5;
          if (hits(e, DEFENSE_ATTRS)) f.defenseBuff += lv(e) * reach * 5;
          break;
        case 'boon':
          if (hits(e, DEFENSE_BOONS)) f.defenseBuff += pct(e) * Math.max(reach, 0.4) * 3;
          if (hits(e, ['Haste'])) f.offenseBuff += pct(e) * reach * 3;
          break;
        case 'damage':
          f.damage += e.type === 'atk' || e.type === 'atkbase' ? (e.amount ?? 1) * (e.targeting?.count ?? 3) / 3 : 1;
          break;
        case 'recharge':
          if (e.type?.toLowerCase() === 'special ct') f.offenseBuff += 1;
          else f.heal += reach * (e.interval ? 1.5 : 1);
          break;
        case 'debuff':
        case 'penalty':
          if (targetsEnemies(e) || e.effect === 'debuff') f.debuff += lv(e) * pct(e);
          break;
        case 'hinderance':
          f.hinder += pct(e) * (e.duration ? Math.min(e.duration, 30) / 15 : 1);
          break;
        case 'cleanse':
          f.cleanse += pct(e);
          break;
      }
    }
  }
  return f;
}

function category(
  key: CategoryScore['key'],
  label: string,
  score: number,
  notes: string[],
): CategoryScore {
  const s = clamp(score);
  return { key, label, score: s, grade: gradeFor(s), notes };
}

export function scoreCategories(team: RumbleUnit[]): CategoryScore[] {
  const f = features(team);
  const st = (s: string) => f.styles[s] ?? 0;
  const spdScore = Math.max(0, Math.min(1, (f.spd - 120) / 110));
  const defScore = Math.max(0, Math.min(1, (f.def - 80) / 160));
  const cdScore = Math.max(0, Math.min(1, (60 - f.cooldown) / 35));

  const offense = category(
    'offense',
    'Offense',
    30 * sat(st('ATK'), 1.5) + 25 * sat(f.damage, 3) + 25 * sat(f.offenseBuff, 6) + 20 * spdScore,
    [`${st('ATK')} ATK-style`, `avg SPD ${Math.round(f.spd)}`, `damage power ${f.damage.toFixed(1)}`],
  );
  const defense = category(
    'defense',
    'Defense & Sustain',
    25 * sat(st('DEF') + st('RCV'), 1.2) +
      25 * sat(f.heal, 2) +
      25 * sat(f.defenseBuff, 5) +
      15 * sat(f.resilience + f.cleanse, 2) +
      10 * defScore,
    [`${st('DEF')} DEF / ${st('RCV')} RCV-style`, `heal power ${f.heal.toFixed(1)}`, `avg DEF ${Math.round(f.def)}`],
  );
  const control = category(
    'control',
    'Control',
    25 * sat(st('DBF'), 1) + 35 * sat(f.debuff, 3) + 30 * sat(f.hinder, 2) + 10 * sat(f.cleanse, 1),
    [`${st('DBF')} DBF-style`, `debuffs ${f.debuff.toFixed(1)}`, `hinderances ${f.hinder.toFixed(1)}`],
  );

  const reach = f.restrictedReach.length
    ? f.restrictedReach.reduce((a, b) => a + b, 0) / f.restrictedReach.length
    : 0.7;
  const famRatio = f.familyConds ? f.familyHits / f.familyConds : 0.5;
  const typeCounts = Object.values(countBy(team.flatMap((u) => u.types)));
  const classCounts = Object.values(countBy(team.flatMap((u) => u.classes)));
  const cohesion = Math.max(0, ...typeCounts, ...classCounts) / Math.max(team.length, 1);
  const synergy = category('synergy', 'Synergy', 60 * reach + 15 * famRatio + 25 * cohesion, [
    f.restrictedReach.length
      ? `type/class buffs reach ${Math.round(reach * 100)}% of the team`
      : 'no type/class-locked buffs',
    ...(f.familyConds ? [`${f.familyHits}/${f.familyConds} character conditions met`] : []),
  ]);

  const roles = [
    st('ATK') > 0 || f.damage >= 3,
    st('DEF') + st('RCV') > 0 || f.heal >= 1.5,
    st('DBF') > 0 || f.debuff + f.hinder >= 2,
    st('SPT') > 0 || f.offenseBuff + f.defenseBuff >= 6,
  ].filter(Boolean).length;
  const versatility = category(
    'versatility',
    'Versatility',
    15 * roles + 20 * Math.min(1, (f.criteria - 1) / 2) + 20 * cdScore,
    [`${roles}/4 roles covered`, `${f.criteria} targeting style(s)`, `avg special CT ${Math.round(f.cooldown)}s`],
  );
  return [offense, defense, control, synergy, versatility];
}

function countBy(xs: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) out[x] = (out[x] ?? 0) + 1;
  return out;
}

const ADVICE: Record<CategoryScore['key'], string> = {
  offense: 'Low damage output: add an ATK-style unit or a crew ATK/Critical buffer.',
  defense: 'Fragile team: add a DEF or RCV unit, a healer, or DEF/HP buffs.',
  control: 'Little control: add a DBF unit with debuffs, Paralysis or Silence.',
  synergy: "Buffs miss teammates: pick units whose type/class buffs cover each other.",
  versatility: 'Narrow game plan: mix roles, targeting styles and faster specials.',
};

/** Rate a team and suggest units from `pool` that best shore up its weakest areas. */
export function rateTeam(team: RumbleUnit[], pool: RumbleUnit[] = []): TeamRating {
  const categories = scoreCategories(team);
  const weights = { offense: 0.27, defense: 0.25, control: 0.18, synergy: 0.15, versatility: 0.15 };
  const fill = team.length / TEAM_SIZE;
  const raw = categories.reduce((s, c) => s + c.score * weights[c.key], 0) * (0.4 + 0.6 * fill);
  // Random full teams of recent units land around raw 65; stretch so they grade
  // C and only well-built teams reach A/S.
  const overall = clamp(52 + (raw - 64) * 1.6);

  const warnings: string[] = [];
  if (team.length < TEAM_SIZE) warnings.push(`${TEAM_SIZE - team.length} empty slot(s): the grade is scaled down.`);
  for (let i = 0; i < team.length; i++)
    for (let j = i + 1; j < team.length; j++)
      if (sharesFamily(team[i], team[j]))
        warnings.push(`${team[i].family[0]} appears twice; Pirate Rumble doesn't allow the same character twice.`);

  const suggestions: Suggestion[] = [];
  const weakest = [...categories].sort((a, b) => a.score - b.score).slice(0, 2);
  for (const c of weakest) {
    if (c.score >= 78) continue;
    const { unitIds, replaceIndex } = pool.length ? suggestUnits(team, pool, c.key) : { unitIds: [] };
    suggestions.push({ text: ADVICE[c.key], category: c.key, unitIds, replaceIndex });
  }
  return { overall, grade: gradeFor(overall), categories, suggestions, warnings };
}

/**
 * Units that raise `key` the most when swapped in. The team's weakest member in
 * that category is replaced (or an empty slot is filled).
 */
export function suggestUnits(
  team: RumbleUnit[],
  pool: RumbleUnit[],
  key: CategoryScore['key'],
  count = 3,
): { unitIds: number[]; replaceIndex?: number } {
  const score = (t: RumbleUnit[]) => {
    const cats = scoreCategories(t);
    return cats.find((c) => c.key === key)!.score * 2 + cats.reduce((s, c) => s + c.score, 0) / cats.length;
  };
  let base = team;
  let replaceIndex: number | undefined;
  if (team.length >= TEAM_SIZE) {
    // drop the member whose removal hurts the target category least
    let best = -Infinity;
    for (let i = 0; i < team.length; i++) {
      const rest = team.filter((_, j) => j !== i);
      const s = score(rest);
      if (s > best) {
        best = s;
        base = rest;
        replaceIndex = i;
      }
    }
  }
  const candidates = pool
    .filter((u) => !base.some((m) => sharesFamily(m, u)))
    .slice(0, 400) // pool is newest-first; recent units are the realistic picks
    .map((u) => ({ u, s: score([...base, u]) }))
    .sort((a, b) => b.s - a.s);
  const picked: RumbleUnit[] = [];
  for (const { u } of candidates) {
    if (picked.some((p) => sharesFamily(p, u))) continue;
    picked.push(u);
    if (picked.length === count) break;
  }
  return { unitIds: picked.map((u) => u.id), replaceIndex };
}
