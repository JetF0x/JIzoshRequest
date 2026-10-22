import type { RumbleUnit } from '../types';

export function StyleChip({ style }: { style: string }) {
  return <span className={`chip style-${style}`}>{style}</span>;
}

export function TypeChips({ unit }: { unit: RumbleUnit }) {
  return (
    <>
      {unit.types.map((t, i) => (
        <span key={i} className={`chip type t-${t}`}>
          {t}
        </span>
      ))}
    </>
  );
}

export function GradeBadge({ grade, score, big }: { grade: string; score?: number; big?: boolean }) {
  return (
    <span className={`grade grade-${grade}${big ? ' big' : ''}`} title={score != null ? `${score}/100` : undefined}>
      {grade}
    </span>
  );
}
