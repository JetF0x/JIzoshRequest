import type { Team } from '../types';

export const MAIN_SLOTS = 5;
export const SUPPORT_SLOTS = 5;

export const emptyTeam = (): Team => ({
  units: Array(MAIN_SLOTS).fill(null),
  supports: Array(SUPPORT_SLOTS).fill(null),
});

// Dual-unit ids contain a dot (3134.1), so slots are joined with "-" and the
// support list follows a "~": "4987-4986--3134.1-4900~4800----".
const join = (slots: (number | null)[]) => slots.map((id) => (id == null ? '' : String(id))).join('-');

export function encodeTeam(team: Team): string {
  const main = join(team.units);
  return team.supports.some((s) => s != null) ? `${main}~${join(team.supports)}` : main;
}

function split(part: string | undefined, size: number): (number | null)[] {
  const ids = (part ?? '').split('-').map((s) => {
    const n = Number(s);
    return s !== '' && Number.isFinite(n) && n > 0 ? n : null;
  });
  return Array.from({ length: size }, (_, i) => ids[i] ?? null);
}

export function decodeTeam(code: string | null | undefined): Team {
  if (!code) return emptyTeam();
  const [main, sup] = code.split('~');
  return { units: split(main, MAIN_SLOTS), supports: split(sup, SUPPORT_SLOTS) };
}
