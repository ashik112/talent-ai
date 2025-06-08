import { PageHeader } from "@/components/layout/page-header";
import { CandidateScreeningForm } from "@/components/candidate-screening/screening-form";

export default function CandidateScreeningPage() {
  return (
    <>
      <PageHeader
        title="Automated Candidate Screening"
        description="Conduct initial text-based screenings to filter candidates using AI."
      />
      <CandidateScreeningForm />
    </>
  );
}
