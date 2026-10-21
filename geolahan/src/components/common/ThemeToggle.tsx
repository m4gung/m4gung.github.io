import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { resolved, setMode } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang';
  return (
    <button type="button" onClick={() => setMode(next)} className="icon-btn" aria-label={label} title={label}>
      {resolved === 'dark' ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
