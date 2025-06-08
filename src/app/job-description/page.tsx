import { PageHeader } from "@/components/layout/page-header";
import { JobDescriptionGeneratorForm } from "@/components/job-description/generator-form";

export default function JobDescriptionPage() {
  return (
    <>
      <PageHeader
        title="Job Description Generator"
        description="Craft compelling job descriptions in English and Bangla, optimized for search engines."
      />
      <JobDescriptionGeneratorForm />
    </>
  );
}
