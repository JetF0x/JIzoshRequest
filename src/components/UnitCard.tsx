import type { RumbleUnit } from '../types';
import UnitThumb from './UnitThumb';
import { StyleChip, TypeChips } from './Chips';

interface Props {
  unit: RumbleUnit;
  onClick?: () => void;
  disabled?: boolean;
  note?: string;
}

export default function UnitCard({ unit, onClick, disabled, note }: Props) {
  return (
    <button type="button" className="unit-card" onClick={onClick} disabled={disabled} title={note ?? unit.name}>
      <UnitThumb unit={unit} />
      <span className="unit-card-body">
        <span className="unit-name">{unit.name}</span>
        <span className="unit-meta">
          <StyleChip style={unit.style} />
          <TypeChips unit={unit} />
          {unit.gp && <span className="chip gp">GP</span>}
          {unit.llb && <span className="chip llb">LLB</span>}
        </span>
        <span className="unit-stats">
          SPD {unit.spd} · DEF {unit.def} · CT {unit.special.cooldown ?? '–'}s
        </span>
        {note && <span className="unit-note">{note}</span>}
      </span>
    </button>
  );
}
