import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_COUNTS } from "@/lib/dashboard-data";

export function PipelineSummary() {
  const stages = PIPELINE_COUNTS;
  const total = stages.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage) => {
            const percentage = Math.round((stage.count / total) * 100) || 0;
            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    {stage.label} ({stage.stage})
                  </span>
                  <span className="font-bold">{stage.count}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
