export function SectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
