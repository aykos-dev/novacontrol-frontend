import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { type AppSection, canAccessSection } from '@/lib/sections';

export default function ProtectedRoute({
  children,
  section,
}: {
  children: React.ReactNode;
  section?: AppSection;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (section && user && !canAccessSection(user, section)) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center text-muted-foreground">
        You do not have access to this section.
      </div>
    );
  }

  return <>{children}</>;
}
