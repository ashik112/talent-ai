import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function ChartCard({ title, description, children, className, footer }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-headline text-primary">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && (
        <div className="p-6 pt-0 text-sm text-muted-foreground">
            {footer}
        </div>
      )}
    </Card>
  );
}
