import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function InterviewSchedulingPage() {
  return (
    <>
      <PageHeader
        title="Interview Scheduling"
        description="Automate interview scheduling with Calendly or Google Calendar integrations."
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
          <CalendarClock className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="font-headline text-2xl text-primary">Coming Soon!</CardTitle>
          <CardDescription>
            The Schedule-Sync Agent is under development. Soon, you'll be able to
            effortlessly schedule interviews with candidates.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Imagine a world without back-and-forth emails for scheduling. That's what we're building!
            Integration with popular calendar tools is on its way.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
