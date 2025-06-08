import { PageHeader } from "@/components/layout/page-header";
import { ResumeScoringForm } from "@/components/resume-scoring/scoring-form";

export default function ResumeScoringPage() {
  return (
    <>
      <PageHeader
        title="Resume Scoring"
        description="Automatically parse and score resumes based on skills and requirements using AI."
      />
      <ResumeScoringForm />
    </>
  );
}
