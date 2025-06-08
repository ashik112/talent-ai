import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium text-foreground mb-1 truncate" title={fileName}>{fileName}</CardTitle>
            <CardDescription className="text-xs">AI-Generated Fit Score</CardDescription>
          </div>
          <Badge variant={badgeVariant} className="text-lg font-headline px-3 py-1">
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={score} className="w-full h-2 mb-3" aria-label={`Score: ${score}%`} />
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3" title={reason}>
          <span className="font-semibold text-foreground">Reason:</span> {reason}
        </p>
      </CardContent>
    </Card>
  );
}
