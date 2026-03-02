import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <section className="rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
          <Skeleton className="h-6 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-[min(560px,100%)]" />
            <Skeleton className="h-4 w-[min(520px,100%)]" />
            <Skeleton className="h-4 w-[min(440px,100%)]" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-40" />
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
