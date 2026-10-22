// Plain-English rendering of Rumble effects. The wording follows the optc-db
// character page (characters/js/directives.js, GPL-3.0) so text matches what
// players already know from that site.
import type { Condition, Effect, GpCondition, PatternStep, Resilience, Targeting } from '../types';

const num = (n: number | undefined) => new Intl.NumberFormat('en').format(n ?? 0);
const list = (a: string[] | undefined) => new Intl.ListFormat('en').format(a ?? []);
const listOr = (a: string[] | undefined) =>
  new Intl.ListFormat('en', { type: 'disjunction' }).format(a ?? []);

export function conditionText(c?: Condition): string {
  if (!c) return '';
  switch (c.type) {
    case 'stat':
      return `When ${c.stat} is ${c.comparator} ${c.count}%, `;
    case 'time':
      if (c.comparator === 'first') return `For the first ${c.count} seconds, `;
      if (c.comparator === 'after') return `After the first ${c.count} seconds, `;
      return `When there are ${c.count} seconds or less remaining, `;
    case 'crew':
    case 'enemies': {
      const who = c.targets ? `${list(c.targets)} characters` : '';
      const rel = c.relative ? (c.type === 'crew' ? ' than the enemy team' : ' than your crew') : '';
      return `When there are ${c.count ?? ''} or ${c.comparator} ${c.type} ${who}${rel}${c.composition ? '' : ' remaining'}, `;
    }
    case 'trigger': {
      const stat = c.stat ?? '';
      const subject = stat.includes('defeated') ? (c.team ? `${c.team} characters are ` : '') : 'this character ';
      const verb =
        stat === 'takes damage' || stat.includes('recieves') || stat.includes('defeated') ? stat : `lands a ${stat}`;
      return `The first ${c.count} times ${subject}${verb}, `;
    }
    case 'debuff':
      return `If this character has ${c.stat}, `;
    case 'defeat':
      return `When ${c.count} characters ${c.team === 'enemies' ? 'on the enemy team ' : c.team === 'crew' ? 'on your crew ' : ''}are defeated, `;
    case 'character':
      return `When ${listOr(c.families)} ${(c.families?.length ?? 0) > 1 ? 'are' : 'is'} ${c.team === 'enemies' ? 'on the enemy team' : 'on your crew'}, `;
    default:
      return '';
  }
}

export function targetText(t?: Targeting): string {
  if (!t) return '';
  const special = (xs: string[]) => xs.some((x) => x === 'self' || x === 'crew' || x === 'enemies');
  let who = list(t.targets.map((x) => x.replace(/^\[(\w+)\]$/, '$1')));
  if (who === 'crew') who = 'crew member(s)';
  if (who === 'enemies') who = !t.count ? 'all enemies' : t.count === 1 ? 'enemy' : who;
  let out = ` to ${t.count ? `${t.count} ` : ''}${who}`;
  if (!special(t.targets)) out += t.count === 1 ? ' character' : ' characters';
  if (t.excludes) out += `, excluding ${list(t.excludes)}${special(t.excludes) ? '' : ' characters'}`;
  if (t.stat) out += ` with the ${t.priority} ${t.stat}`;
  return out;
}

function body(e: Effect): string {
  const attrs = list(e.attributes);
  switch (e.effect) {
    case 'buff':
      return `Applies Lv.${e.level} ${attrs} up buff`;
    case 'debuff':
      return `Inflicts Lv.${e.level} ${attrs} down debuff`;
    case 'damage': {
      const bypass = e.defbypass || e.defignore ? ' that will ignore DEF' : '';
      switch (e.type) {
        case 'time':
          return `Deals Lv.${e.level} Damage Over Time${bypass}`;
        case 'atk':
          return `Deals ${num(e.amount)}x ${e.leader ? "Leader's " : ''}ATK in damage${bypass}`;
        case 'atkbase':
          return `Deals ${num(e.amount)}x ${e.leader ? "Leader's " : ''}base ATK in damage${bypass}`;
        case 'fixed':
          return `Deals ${num(e.amount)} fixed damage${bypass}`;
        case 'random':
          return `Randomly deals between ${num(e.amountrange?.[0])}-${num(e.amountrange?.[1])} fixed damage${bypass}`;
        case 'cut':
          return `${num(e.amount)}% health cut${bypass}`;
        default:
          return `Deals damage${bypass}`;
      }
    }
    case 'recharge': {
      const every = e.interval ? ` every ${e.interval} ${e.interval === 1 ? 'second' : 'seconds'}` : '';
      switch (e.type?.toLowerCase()) {
        case 'rcv':
          return `Restores ${num(e.amount)}x RCV of HP${every}`;
        case 'percentage':
          return `Restores ${num(e.amount)}% of HP${every}`;
        case 'fixed':
          return `Restores ${num(e.amount)} fixed HP${every}`;
        case 'special ct':
          return `Reduces ${num(e.amount)}% of Special CT${every}`;
        default:
          return `Restores HP${every}`;
      }
    }
    case 'hinderance':
      return e.amount
        ? `Removes ${num(e.amount)}% of ${attrs}`
        : `${e.chance}% chance to inflict ${e.level ? `Lv.${e.level} ` : ''}${attrs}`;
    case 'boon': {
      const pre = e.chance ? `${e.chance}% chance to ` : '';
      const g = (word: string) => (e.chance ? word.toLowerCase() : word);
      switch (attrs) {
        case 'Provoke':
          return `${pre}${g('Provoke')} enemies`;
        case 'Haste':
          return `${pre}${g('Grant')} Haste`;
        case 'Counter':
          return `${pre}${g('Grant')} ${e.amount}x Counter`;
        case 'Revive':
          return `${pre}${g('Revive')} to ${e.amount}% HP after death`;
        case 'Shield':
          return `${pre}${g('Grant')} Shield`;
        default:
          return `${pre}${g('Reduce')} ${attrs}`;
      }
    }
    case 'penalty':
      if (attrs === 'HP' && e.amount) return `${num(e.amount)}% health cut`;
      if (e.level) return `Inflicts Lv.${e.level} ${attrs} down penalty`;
      return `${e.chance ?? 100}% chance to ${attrs}`;
    case 'cleanse':
      return `${e.chance ?? 100}% chance to cleanse ${attrs} debuffs`;
    default:
      return e.effect;
  }
}

export function effectText(e: Effect): string {
  const range = e.range ? ` in a ${e.range.size}, ${e.range.direction} range` : '';
  const dur = e.duration ? ` for ${e.duration} seconds` : '';
  const rep = e.repeat ? ` ${num(e.repeat)} times` : '';
  return `${conditionText(e.condition)}${body(e)}${targetText(e.targeting)}${range}${dur}${rep}.`;
}

export function targetCriteriaText(t: { criteria: string; comparator?: string }): string {
  return t.criteria === 'near' ? 'Nearby enemies' : `Enemies with the ${t.comparator} ${t.criteria}`;
}

export function patternText(p: PatternStep): string {
  if (p.action === 'heal') {
    const area = p.area ? p.area[0].toUpperCase() + p.area.slice(1) : 'Self';
    return `Lv.${p.level} ${area === 'Self' ? area : `${area} Range`} Heal`;
  }
  return `${p.type} Attack`;
}

export function resilienceText(r: Resilience): string {
  const c = conditionText(r.condition);
  switch (r.type) {
    case 'dmgboost':
      return `${c}${r.amount}x boost to ${r.attribute} enemies.`;
    case 'healing':
      return `${c}Heals ${r.amount} HP every ${r.interval} seconds.`;
    case 'damage':
      return `${c}${r.percentage}% reduction to ${r.attribute} damage.`;
    case 'debuff':
      return `${c}${r.chance}% to resist ${r.attribute}.`;
    default:
      return c;
  }
}

export function gpConditionText(g: GpCondition): string {
  switch (g.type) {
    case 'damage':
      return `After dealing damage ${g.count} times`;
    case 'action':
      return `After ${g.action}ing ${g.count} times`;
    case 'debuff':
      return `After landing ${g.attribute} ${g.count} times`;
    case 'attack':
      return `After landing ${g.count} ${g.attack} attacks`;
    case 'defeat':
      return `After ${g.count} ${g.team} are defeated`;
    case 'special':
      return `After ${g.team} uses ${g.count} Rumble Specials`;
    case 'dbfreceived':
      return `After ${g.count} debuffs received`;
    case 'dmgdealt':
      return `After ${num(g.count)} damage dealt`;
    case 'dmgreceived':
      return `After ${num(g.count)} damage received`;
    case 'hitreceived':
      return `After ${g.count} hits received`;
    default:
      return `After ${g.count} ${g.type}`;
  }
}
