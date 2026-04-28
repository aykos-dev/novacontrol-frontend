import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ThemeMode, useThemeStore } from '@/stores/theme.store';

const labels: Record<ThemeMode, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Как в системе',
};

export default function ThemeToggle({
  className,
  align = 'end',
}: {
  className?: string;
  align?: 'start' | 'end';
}) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={className}
            aria-label={`Тема: ${labels[mode]}`}
          />
        }
      >
        <Icon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(v) => v && setMode(v as ThemeMode)}
        >
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4 opacity-70" />
            {labels.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4 opacity-70" />
            {labels.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4 opacity-70" />
            {labels.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
