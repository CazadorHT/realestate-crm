import { Skeleton } from "@/components/ui/skeleton";

export function PropertiesTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="h-12 border-b bg-muted/50 px-4 flex items-center">
         <div className="flex gap-2 w-full">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[60px] ml-auto" />
         </div>
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-3 w-[200px]" />
            </div>
            <div className="ml-auto space-y-2">
               <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
