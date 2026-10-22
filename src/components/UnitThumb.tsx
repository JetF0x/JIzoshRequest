import { useState } from 'react';
import type { RumbleUnit } from '../types';
import { thumbnailUrl } from '../lib/units';

export default function UnitThumb({ unit, size = 56 }: { unit: RumbleUnit; size?: number }) {
  const [failed, setFailed] = useState(false);
  const type = unit.types[0];
  return failed ? (
    <span className={`thumb thumb-fallback t-${type}`} style={{ width: size, height: size }} title={unit.name}>
      {type}
    </span>
  ) : (
    <img
      className={`thumb t-${type}`}
      src={thumbnailUrl(unit)}
      alt={unit.name}
      title={unit.name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
