export function DataTableSkeleton() {
  return (
    <div className="w-full px-[24px]">
      <div className="flex items-center py-4 gap-4">
        <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-md bg-muted animate-pulse ml-auto" />
      </div>
      <div className="rounded-md border">
        <div className="w-full animate-pulse">
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex border-b">
              {Array.from({ length: 7 }).map((_, colIdx) => (
                <div key={colIdx} className="flex-1 p-4 text-center">
                  <div className="h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
