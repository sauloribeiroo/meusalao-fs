import { Card, CardContent } from "@/components/ui/card";

export function SalonCardSkeleton() {
  return (
    <Card
      className="flex h-full flex-col overflow-hidden rounded-2xl border-border bg-card shadow-xs"
      aria-hidden="true"
    >
      <div className="aspect-video w-full animate-pulse bg-muted" />

      <CardContent className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-3.5 w-1/3 animate-pulse rounded-md bg-muted" />

          <div className="flex items-center gap-2 pt-1">
            <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="flex gap-2 pt-1">
            <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        <div className="mt-4 pt-2">
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
