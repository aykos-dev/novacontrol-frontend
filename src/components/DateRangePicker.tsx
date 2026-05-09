import { subWeeks, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { displayToIso, isoToDisplay } from '@/lib/date-format';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: '1 Week', weeks: 1 },
  { label: '2 Weeks', weeks: 2 },
  { label: '4 Weeks', weeks: 4 },
] as const;

/** True when the range is exactly "last N weeks through today" (same as clicking the preset). */
function matchesWeekPreset(value: DateRange, weeks: number): boolean {
  const today = new Date();
  const toStr = format(today, 'yyyy-MM-dd');
  const fromStr = format(subWeeks(today, weeks), 'yyyy-MM-dd');
  return value.from === fromStr && value.to === toStr;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handlePreset = (weeks: number) => {
    const today = new Date();
    const from = subWeeks(today, weeks);
    onChange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/40 p-1"
        role="group"
        aria-label="Quick date ranges"
      >
        {presets.map((preset) => {
          const selected = matchesWeekPreset(value, preset.weeks);
          return (
            <Button
              key={preset.label}
              type="button"
              variant={selected ? 'default' : 'ghost'}
              size="sm"
              className={selected ? 'shadow-sm' : 'text-muted-foreground'}
              aria-pressed={selected}
              onClick={() => handlePreset(preset.weeks)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          placeholder="dd-mm-yyyy"
          value={isoToDisplay(value.from)}
          onChange={(e) => onChange({ ...value, from: displayToIso(e.target.value) })}
          className="w-36"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          inputMode="numeric"
          placeholder="dd-mm-yyyy"
          value={isoToDisplay(value.to)}
          onChange={(e) => onChange({ ...value, to: displayToIso(e.target.value) })}
          className="w-36"
        />
      </div>
    </div>
  );
}
