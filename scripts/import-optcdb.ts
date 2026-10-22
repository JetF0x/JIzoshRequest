/**
 * Imports Pirate Rumble data from the community OPTC database
 * (https://github.com/optc-db/optc-db.github.io, GPL-3.0) and writes a
 * normalized, max-level snapshot to src/data/units.json.
 *
 * Usage: npm run import-data            (downloads from GitHub)
 *        OPTCDB_DIR=/path npm run import-data   (reads local copies of units.js,
 *        families.js, rumble.json and utils.js from one folder)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import type { Effect, RumbleUnit, Special, UnitType } from '../src/types';

const RAW = 'https://raw.githubusercontent.com/optc-db/optc-db.github.io/master/common/';
const SOURCES: Record<string, string> = {
  'units.js': 'data/units.js',
  'families.js': 'data/families.js',
  'rumble.json': 'data/rumble.json',
  'utils.js': 'js/utils.js',
};
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/units.json');

async function load(file: string): Promise<string> {
  const dir = process.env.OPTCDB_DIR;
  if (dir) return readFile(join(dir, file), 'utf8');
  const res = await fetch(RAW + SOURCES[file]);
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  return res.text();
}

// optc-db stores each level as a list of effects, where later levels only
// carry `{ override: {...} }` patches for the matching effect index.
type RawLevel = {
  effects: (Effect | { override: Partial<Effect> } | Record<string, never>)[];
  cooldown?: number;
  uses?: number;
};

export function resolveMaxLevel(levels: RawLevel[] | undefined): Special {
  if (!levels?.length) return { effects: [] };
  let effects: Effect[] = [];
  let cooldown: number | undefined;
  let uses: number | undefined;
  for (const level of levels) {
    // An entry without an `effect` kind is a patch: `{ override }`, or `{}` for "unchanged".
    const isPatch = (e: object) => !('effect' in e);
    const allOverrides = level.effects.every(isPatch);
    const next = level.effects.map((e, i) =>
      isPatch(e)
        ? ({ ...effects[i], ...('override' in e ? e.override : {}) } as Effect)
        : (structuredClone(e) as Effect),
    );
    // A patch-only level may list fewer effects than it inherits; keep the rest.
    effects = allOverrides ? [...next, ...effects.slice(next.length)] : next;
    cooldown = level.cooldown ?? cooldown;
    uses = level.uses ?? uses;
  }
  const out: Special = { effects: effects.filter((e) => e?.effect) }; // drop malformed upstream entries
  if (cooldown !== undefined) out.cooldown = cooldown;
  if (uses !== undefined) out.uses = uses;
  return out;
}

type RawUnit = [string, string | string[], string | string[] | string[][], number | string, number, ...number[]];

function typesAndClasses(raw: RawUnit, id: number): { types: UnitType[]; classes: string[] } {
  const [, type, cls] = raw;
  // Dual units ("3134.1" / "3134.2") pick one side of the pair.
  const side = Math.round((id % 1) * 10) - 1;
  const types = (Array.isArray(type) ? type : [type]) as UnitType[];
  if (Array.isArray(cls) && Array.isArray(cls[0])) {
    const pairs = cls as string[][];
    if (side >= 0) return { types: [types[side] ?? types[0]], classes: pairs[side] ?? pairs[0] };
    return { types: [...new Set(types)], classes: pairs[2] ?? [...new Set(pairs.flat())] };
  }
  const classes = Array.isArray(cls) ? (cls as string[]) : [cls as string];
  return { types: side >= 0 ? [types[side] ?? types[0]] : [...new Set(types)], classes };
}

/** Pulls `utils.getThumbnailUrl` out of optc-db's utils.js; it carries a table of special-case image paths. */
function extractThumbnailFn(utilsJs: string): string {
  const start = utilsJs.indexOf('utils.getThumbnailUrl = function');
  if (start < 0) throw new Error('getThumbnailUrl not found in utils.js');
  let depth = 0;
  for (let i = utilsJs.indexOf('{', start); i < utilsJs.length; i++) {
    if (utilsJs[i] === '{') depth++;
    else if (utilsJs[i] === '}' && --depth === 0) return utilsJs.slice(start, i + 1);
  }
  throw new Error('Unbalanced getThumbnailUrl');
}

async function main() {
  const [unitsJs, familiesJs, rumbleJson, utilsJs] = await Promise.all([
    load('units.js'),
    load('families.js'),
    load('rumble.json'),
    load('utils.js'),
  ]);

  // units.js / families.js assign to `window.*`; run them in an empty sandbox.
  const ctx = vm.createContext({ window: {} as Record<string, unknown>, utils: {} as Record<string, unknown> });
  vm.runInContext(unitsJs, ctx, { timeout: 10_000 });
  vm.runInContext(familiesJs, ctx, { timeout: 10_000 });
  vm.runInContext(extractThumbnailFn(utilsJs), ctx, { timeout: 10_000 });
  const thumbPath = ctx.utils.getThumbnailUrl as (id: number) => string;
  const units = ctx.window.units as RawUnit[];
  const families = ctx.window.families as Record<string, string[] | string | null>;
  const rumble = (JSON.parse(rumbleJson) as { units: Record<string, any>[] }).units;
  const byId = new Map(rumble.map((r) => [r.id as number, r]));

  const out: RumbleUnit[] = [];
  for (const entry of rumble) {
    let kit = entry;
    for (let hops = 0; kit.basedOn && hops < 5; hops++) kit = byId.get(kit.basedOn) ?? kit;
    if (!kit.stats) continue;

    const id = entry.id as number;
    const baseId = Math.floor(id);
    const raw = units[baseId - 1];
    if (!raw) continue;
    const { types, classes } = typesAndClasses(raw, id);
    const fam = families[baseId];
    const side = Math.round((id % 1) * 10);
    const name = side ? `${raw[0]} (${types[0]} side)` : raw[0];

    const unit: RumbleUnit = {
      id,
      name,
      types,
      classes,
      stars: raw[3],
      cost: raw[4],
      family: fam ? (Array.isArray(fam) ? fam : [fam]) : [raw[0]],
      hp: raw[12] as number,
      atk: raw[13] as number,
      rcv: raw[14] as number,
      style: kit.stats.rumbleType,
      def: kit.stats.def,
      spd: kit.stats.spd,
      target: kit.target ?? { criteria: 'near' },
      pattern: kit.pattern ?? [],
      resilience: kit.resilience ?? [],
      ability: resolveMaxLevel(kit.ability).effects,
      special: resolveMaxLevel(kit.special),
      thumb: thumbPath(baseId).replace(/^\/api\/images\//, ''),
    };
    if (kit.gpability) {
      unit.gp = {
        condition: kit.gpcondition ?? [],
        ability: resolveMaxLevel(kit.gpability).effects,
        special: resolveMaxLevel(kit.gpspecial),
      };
    }
    if (kit.llbability) {
      unit.llb = {
        ability: resolveMaxLevel(kit.llbability).effects,
        special: resolveMaxLevel(kit.llbspecial),
        ...(kit.llbresilience ? { resilience: kit.llbresilience } : {}),
      };
    }
    out.push(unit);
  }

  out.sort((a, b) => b.id - a.id); // newest first
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out));
  console.log(`Wrote ${out.length} Rumble units (from ${rumble.length} entries) to ${OUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
