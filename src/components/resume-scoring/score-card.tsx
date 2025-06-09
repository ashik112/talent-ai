
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ScoreCardProps {
  fileName: string;
  score: number;
  reason: string;
  className?: string;
}

export function ScoreCard({ fileName, score, reason, className }: ScoreCardProps) {
  let badgeVariant: "default" | "secondary" | "destructive" = "secondary";
  if (score >= 80) badgeVariant = "default"; // Corresponds to primary
  else if (score < 50) badgeVariant = "destructive";

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center gap-2">
          <CardTitle className="text-sm font-medium text-foreground truncate flex-1" title={fileName}>
            {fileName}
          </CardTitle>
          <Badge variant={badgeVariant} className="text-xs font-semibold px-2 py-0.5">
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4 space-y-2">
        <Progress value={score} className="w-full h-1.5" aria-label={`Score: ${score}%`} />
        <p className="text-xs text-muted-foreground leading-normal line-clamp-3" title={reason}>
          <span className="font-semibold text-foreground/90">Reason:</span> {reason}
        </p>
      </CardContent>
    </Card>
  );
}
