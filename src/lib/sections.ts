import {
  BarChart3,
  LayoutDashboard,
  Receipt,
  Settings2,
  Tags,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppSection =
  | 'dashboard'
  | 'clients'
  | 'finance'
  | 'analytics'
  | 'expenseCategories'
  | 'users'
  | 'settings';

export interface SectionConfig {
  id: AppSection;
  to: string;
  icon: LucideIcon;
  labelKey: string;
}

export const ALL_SECTIONS: SectionConfig[] = [
  { id: 'dashboard', to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'clients', to: '/clients', icon: Users, labelKey: 'nav.clients' },
  { id: 'finance', to: '/finance', icon: Receipt, labelKey: 'nav.finance' },
  { id: 'analytics', to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  {
    id: 'expenseCategories',
    to: '/expense-categories',
    icon: Tags,
    labelKey: 'nav.expenseCategories',
  },
  { id: 'users', to: '/users', icon: UserCog, labelKey: 'nav.users' },
  { id: 'settings', to: '/settings', icon: Settings2, labelKey: 'nav.settings' },
];

export function canAccessSection(
  user: { role: 'ADMIN' | 'VIEWER'; allowed_sections?: AppSection[] | null } | null,
  section: AppSection,
) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.allowed_sections?.includes(section) ?? false;
}
