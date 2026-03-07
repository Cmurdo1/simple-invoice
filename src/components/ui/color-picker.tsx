import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0, s = 0, v = max;
  if (delta !== 0) {
    s = delta / max;
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return [h, Math.round(s * 100), Math.round(v * 100)];
}

function hsvToHex(h: number, s: number, v: number): string {
  const sv = s / 100, vv = v / 100;
  const c = vv * sv;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vv - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Preset swatches ───────────────────────────────────────────────────────────

const SWATCHES = [
  '#228B22','#16a34a','#059669','#0d9488',
  '#0369a1','#4169E1','#7c3aed','#9932CC',
  '#db2777','#DC143C','#ea580c','#FF8C00',
  '#ca8a04','#8B4513','#36454F','#000080',
];

// ── Saturation/Brightness Canvas ─────────────────────────────────────────────

interface SBCanvasProps {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (s: number, b: number) => void;
  disabled?: boolean;
}

function SBCanvas({ hue, saturation, brightness, onChange, disabled }: SBCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onChange(Math.round(x * 100), Math.round((1 - y) * 100));
  }, [onChange]);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    const move = (e: MouseEvent) => { if (dragging.current) pick(e); };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move); };
  }, [pick]);

  const cursorX = `${saturation}%`;
  const cursorY = `${100 - brightness}%`;

  return (
    <div
      ref={ref}
      className={cn('relative h-36 w-full rounded-md overflow-hidden select-none', disabled && 'pointer-events-none opacity-50')}
      style={{
        background: `linear-gradient(to bottom, transparent, #000),
                     linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
      }}
      onMouseDown={(e) => { dragging.current = true; pick(e); }}
    >
      {/* Cursor */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{ left: cursorX, top: cursorY, backgroundColor: hsvToHex(hue, saturation, brightness) }}
      />
    </div>
  );
}

// ── Hue Slider ────────────────────────────────────────────────────────────────

interface HueSliderProps {
  hue: number;
  onChange: (h: number) => void;
  disabled?: boolean;
}

function HueSlider({ hue, onChange, disabled }: HueSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(Math.round(x * 360));
  }, [onChange]);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    const move = (e: MouseEvent) => { if (dragging.current) pick(e); };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move); };
  }, [pick]);

  return (
    <div
      ref={ref}
      className={cn('relative h-4 w-full rounded-full cursor-pointer select-none', disabled && 'pointer-events-none opacity-50')}
      style={{
        background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
      }}
      onMouseDown={(e) => { dragging.current = true; pick(e); }}
    >
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue}, 100%, 50%)` }}
      />
    </div>
  );
}

// ── Main ColorPicker ──────────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, disabled, label, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value);

  // Sync when external value changes
  useEffect(() => {
    setHsv(hexToHsv(value));
    setHexInput(value);
  }, [value]);

  const handleSBChange = (s: number, b: number) => {
    const newHsv: [number, number, number] = [hsv[0], s, b];
    setHsv(newHsv);
    const hex = hsvToHex(...newHsv);
    setHexInput(hex);
    onChange(hex);
  };

  const handleHueChange = (h: number) => {
    const newHsv: [number, number, number] = [h, hsv[1], hsv[2]];
    setHsv(newHsv);
    const hex = hsvToHex(...newHsv);
    setHexInput(hex);
    onChange(hex);
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw);
    const hex = raw.startsWith('#') ? raw : '#' + raw;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setHsv(hexToHsv(hex));
      onChange(hex);
    }
  };

  const handleSwatch = (hex: string) => {
    setHsv(hexToHsv(hex));
    setHexInput(hex);
    onChange(hex);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-all',
            'hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <div
            className="h-6 w-6 rounded-md border border-white/20 shadow-inner flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="flex-1 text-left font-mono text-xs text-muted-foreground">{value.toUpperCase()}</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          <div className="flex gap-0.5">
            {SWATCHES.slice(0, 5).map(s => (
              <div key={s} className="h-3 w-3 rounded-sm" style={{ backgroundColor: s }} />
            ))}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 space-y-4" align="start" sideOffset={6}>
        {/* Canvas */}
        <SBCanvas
          hue={hsv[0]}
          saturation={hsv[1]}
          brightness={hsv[2]}
          onChange={handleSBChange}
          disabled={disabled}
        />

        {/* Hue Slider */}
        <HueSlider hue={hsv[0]} onChange={handleHueChange} disabled={disabled} />

        {/* Hex input + preview */}
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-md border border-white/20 shadow-inner flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">#</span>
            <Input
              value={hexInput.replace('#', '')}
              onChange={(e) => handleHexInput(e.target.value)}
              className="pl-6 font-mono text-sm uppercase"
              maxLength={6}
              placeholder="228B22"
            />
          </div>
        </div>

        {/* Swatches */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Presets</p>
          <div className="grid grid-cols-8 gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => handleSwatch(swatch)}
                className={cn(
                  'h-7 w-7 rounded-md border-2 transition-all hover:scale-110',
                  value.toLowerCase() === swatch.toLowerCase()
                    ? 'border-foreground ring-1 ring-foreground ring-offset-1'
                    : 'border-transparent hover:border-white/40'
                )}
                style={{ backgroundColor: swatch }}
                title={swatch}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
