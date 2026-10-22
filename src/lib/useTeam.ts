import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Team } from '../types';
import { decodeTeam, emptyTeam, encodeTeam } from './teamCode';

const KEY = 'rumble-team-shop:last-team';

function readSaved(): Team {
  try {
    return decodeTeam(localStorage.getItem(KEY));
  } catch {
    return emptyTeam();
  }
}

/** Team state mirrored to `?t=` (for sharing) and localStorage (to resume later). */
export function useTeam(): [Team, (t: Team) => void] {
  const [params, setParams] = useSearchParams();
  const [team, setTeam] = useState<Team>(() => (params.get('t') ? decodeTeam(params.get('t')) : readSaved()));

  useEffect(() => {
    const code = encodeTeam(team);
    try {
      localStorage.setItem(KEY, code);
    } catch {
      // storage unavailable (private mode); sharing via URL still works
    }
    if (params.get('t') !== code) setParams({ t: code }, { replace: true });
  }, [team]);

  return [team, setTeam];
}

export function shareUrl(team: Team): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/builder?t=${encodeTeam(team)}`;
}
