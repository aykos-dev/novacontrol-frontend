import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ALL_SECTIONS, canAccessSection } from '@/lib/sections';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const allItems = ALL_SECTIONS.filter((section) =>
    canAccessSection(user, section.id),
  );

  return (
    <nav className="flex flex-col gap-1 px-3">
      {allItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border border-primary/25 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative flex h-full flex-col">
      <div
        className="pointer-events-none absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-primary via-[var(--wb-violet)] to-[var(--wb-lilac)] opacity-90"
        aria-hidden
      />
      <div className="flex min-h-16 flex-col gap-0.5 border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--wb-violet)] text-primary-foreground shadow-lg shadow-primary/30">
            <span className="font-heading text-sm font-bold tracking-tight">WB</span>
          </div>
          <div className="min-w-0">
            <span className="font-heading block truncate text-lg font-semibold tracking-tight text-sidebar-foreground">
              {t('app.brand')}
            </span>
            <p className="truncate text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <SidebarNav onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden md:flex-row">
        <aside className="relative hidden min-h-0 w-64 shrink-0 border-r border-sidebar-border bg-sidebar/90 backdrop-blur-md md:flex md:flex-col">
          <SidebarContent />
        </aside>

        <SheetContent side="left" className="w-[min(20rem,100vw)] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">{t('app.navigation')}</SheetTitle>
          <SheetDescription className="sr-only">{t('app.navDescription')}</SheetDescription>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-40 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/85 px-4 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <SheetTrigger
                render={<Button variant="outline" size="icon" className="shrink-0 md:hidden" />}
              >
                <Menu className="size-5" />
                <span className="sr-only">{t('app.openMenu')}</span>
              </SheetTrigger>
              <p className="hidden min-w-0 truncate font-heading text-sm font-semibold text-foreground sm:block md:hidden">
                {t('app.mobileTitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <LanguageSwitcher />
              <ThemeToggle className="shrink-0" />
              {user && (
                <>
                  <span className="hidden max-w-[40vw] truncate text-sm font-medium sm:inline">
                    {user.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="hidden border-primary/20 bg-primary/10 text-primary sm:inline-flex"
                  >
                    {user.role}
                  </Badge>
                </>
              )}
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t('app.logout')}</span>
              </Button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8 lg:py-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Outlet />
          </main>
        </div>
      </div>
    </Sheet>
  );
}
