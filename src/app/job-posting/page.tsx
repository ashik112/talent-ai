import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function JobPostingPage() {
  return (
    <>
      <PageHeader
        title="Automated Job Posting"
        description="Seamlessly post your job openings to multiple platforms."
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
          <Briefcase className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="font-headline text-2xl text-primary">Coming Soon!</CardTitle>
          <CardDescription>
            Our Job-Poster Agent will soon automate posting to LinkedIn, BDJobs, StackOverflow, and more.
            Stay tuned for updates on this powerful feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            We are working hard to bring you an integrated job posting experience.
            This feature will save you time and help you reach a wider talent pool.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
