export function ChartAreaSkeleton({ heightClass }: { heightClass: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${heightClass}`}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
    </div>
  );
}
