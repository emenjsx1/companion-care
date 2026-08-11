import { useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

type PresetKey = 'today' | 'week' | 'month' | 'last30' | 'last3months' | 'year' | 'custom';

const presets: Record<Exclude<PresetKey, 'custom'>, { label: string; getRange: () => { startDate: Date; endDate: Date } }> = {
  today: {
    label: 'Hoje',
    getRange: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  week: {
    label: 'Esta Semana',
    getRange: () => ({
      startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  month: {
    label: 'Este Mês',
    getRange: () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    }),
  },
  last30: {
    label: 'Últimos 30 dias',
    getRange: () => ({
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    }),
  },
  last3months: {
    label: 'Últimos 3 meses',
    getRange: () => ({
      startDate: startOfDay(subMonths(new Date(), 3)),
      endDate: endOfDay(new Date()),
    }),
  },
  year: {
    label: 'Este Ano',
    getRange: () => ({
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
    }),
  },
};

export const getDefaultDateRange = (): DateRange => {
  const preset = presets.month;
  return {
    ...preset.getRange(),
    label: preset.label,
  };
};

export const DateRangeFilter = ({ value, onChange, className }: DateRangeFilterProps) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('month');
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);

  const handlePresetChange = (preset: PresetKey) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const { getRange, label } = presets[preset];
      onChange({ ...getRange(), label });
    }
  };

  const handleCustomStartChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        startDate: startOfDay(date),
        endDate: value.endDate,
        label: 'Personalizado',
      });
      setSelectedPreset('custom');
    }
    setCustomStartOpen(false);
  };

  const handleCustomEndChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        startDate: value.startDate,
        endDate: endOfDay(date),
        label: 'Personalizado',
      });
      setSelectedPreset('custom');
    }
    setCustomEndOpen(false);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetKey)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(presets).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {selectedPreset === 'custom' && (
        <>
          <Popover open={customStartOpen} onOpenChange={setCustomStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !value.startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(value.startDate, 'dd/MM/yyyy', { locale: pt })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.startDate}
                onSelect={handleCustomStartChange}
                initialFocus
                locale={pt}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover open={customEndOpen} onOpenChange={setCustomEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !value.endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(value.endDate, 'dd/MM/yyyy', { locale: pt })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.endDate}
                onSelect={handleCustomEndChange}
                initialFocus
                locale={pt}
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {selectedPreset !== 'custom' && (
        <span className="text-sm text-muted-foreground">
          {format(value.startDate, 'dd/MM', { locale: pt })} - {format(value.endDate, 'dd/MM/yyyy', { locale: pt })}
        </span>
      )}
    </div>
  );
};
