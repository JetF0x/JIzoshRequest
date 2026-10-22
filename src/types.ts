// Shapes of the normalized Pirate Rumble data produced by scripts/import-optcdb.ts.
// The effect objects mirror optc-db's rumble.json format, resolved to max level.

export type UnitType = 'STR' | 'DEX' | 'QCK' | 'PSY' | 'INT';
export type RumbleStyle = 'ATK' | 'DEF' | 'RCV' | 'SPT' | 'DBF';

export const UNIT_TYPES: UnitType[] = ['STR', 'DEX', 'QCK', 'PSY', 'INT'];
export const RUMBLE_STYLES: RumbleStyle[] = ['ATK', 'DEF', 'RCV', 'SPT', 'DBF'];
export const CLASSES = [
  'Fighter',
  'Slasher',
  'Striker',
  'Shooter',
  'Free Spirit',
  'Driven',
  'Cerebral',
  'Powerhouse',
] as const;

export interface Condition {
  type: string;
  comparator?: string;
  count?: number;
  stat?: string;
  team?: string;
  relative?: boolean;
  families?: string[];
  targets?: string[];
  composition?: unknown;
}

export interface Targeting {
  targets: string[];
  count?: number;
  priority?: string;
  stat?: string;
  excludes?: string[];
}

export interface Effect {
  effect: string; // buff | debuff | hinderance | boon | penalty | cleanse | damage | recharge
  attributes?: string[];
  level?: number;
  chance?: number;
  duration?: number;
  amount?: number;
  amountrange?: number[];
  type?: string; // damage/recharge kind: atk | fixed | cut | time | percentage | RCV ...
  targeting?: Targeting;
  condition?: Condition;
  range?: { direction?: string; size?: string };
  repeat?: number;
  interval?: number;
  leader?: boolean;
  defbypass?: boolean;
  defignore?: boolean;
}

export interface Special {
  cooldown?: number;
  uses?: number;
  effects: Effect[];
}

export interface PatternStep {
  action: 'attack' | 'heal';
  type?: 'Normal' | 'Power' | 'Full';
  area?: string;
  level?: number;
}

export interface Resilience {
  type: string; // debuff | healing | damage | dmgboost
  attribute?: string;
  chance?: number;
  amount?: number;
  interval?: number;
  percentage?: number;
  condition?: Condition;
}

export interface GpCondition {
  type: string;
  count: number;
  team?: string;
  action?: string;
  attack?: string;
  attribute?: string;
}

export interface RumbleUnit {
  id: number;
  name: string;
  types: UnitType[];
  classes: string[];
  stars: number | string;
  cost: number;
  family: string[];
  hp: number;
  atk: number;
  rcv: number;
  style: RumbleStyle;
  def: number;
  spd: number;
  target: { criteria: string; comparator?: string };
  pattern: PatternStep[];
  resilience: Resilience[];
  ability: Effect[];
  special: Special;
  gp?: { condition: GpCondition[]; ability: Effect[]; special: Special };
  llb?: { ability: Effect[]; special: Special; resilience?: Resilience[] };
  thumb: string; // image path under https://optc-db.github.io/api/images/
}

export interface Team {
  units: (number | null)[]; // 5 main slots
  supports: (number | null)[]; // support slots (shown, not rated)
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface CategoryScore {
  key: 'offense' | 'defense' | 'control' | 'synergy' | 'versatility';
  label: string;
  score: number; // 0..100
  grade: Grade;
  notes: string[];
}

export interface Suggestion {
  text: string;
  category: CategoryScore['key'];
  unitIds: number[];
  replaceIndex?: number; // team member the suggested units would replace (full teams)
}

export interface TeamRating {
  overall: number;
  grade: Grade;
  categories: CategoryScore[];
  suggestions: Suggestion[];
  warnings: string[];
}
