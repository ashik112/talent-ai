
"use server";

import { generateJobDescription as genJobDescFlow, type GenerateJobDescriptionInput, type GenerateJobDescriptionOutput } from "@/ai/flows/generate-job-description";
import { scoreResumes as scoreResumesFlow, type ScoreResumesInput, type ScoreResumesOutput } from "@/ai/flows/score-resumes";
import { conductCandidateScreening as conductScreeningFlow, type ConductCandidateScreeningInput, type ConductCandidateScreeningOutput } from "@/ai/flows/conduct-candidate-screening";
import { z } from "zod";

export async function generateJobDescriptionAction(
  input: GenerateJobDescriptionInput
): Promise<GenerateJobDescriptionOutput | { error: string }> {
  try {
    const result = await genJobDescFlow(input);
    return result;
  } catch (error) {
    console.error("Error generating job description:", error);
    return { error: "Failed to generate job description. Please try again." };
  }
}

export async function scoreResumesAction(
  input: ScoreResumesInput
): Promise<ScoreResumesOutput | { error: string }> {
  console.log(`[scoreResumesAction] Starting for ${input.resumeDataUris.length} resumes.`);
  console.time("[scoreResumesAction] Total time for scoreResumesFlow");
  try {
    // Basic validation, can be enhanced with Zod schema if needed here too
    if (!input.jobDescription || input.resumeDataUris.length === 0) {
      console.error("[scoreResumesAction] Error: Job description and at least one resume are required.");
      return { error: "Job description and at least one resume are required." };
    }
    
    const result = await scoreResumesFlow(input);
    
    console.timeEnd("[scoreResumesAction] Total time for scoreResumesFlow");
    if ("error" in result) {
        console.error(`[scoreResumesAction] Error from scoreResumesFlow: ${result.error}`);
    } else {
        console.log(`[scoreResumesAction] Successfully processed ${result.length} resumes.`);
    }
    return result;

  } catch (error) {
    console.timeEnd("[scoreResumesAction] Total time for scoreResumesFlow");
    console.error("[scoreResumesAction] Critical error scoring resumes:", error);
    
    let errorMessage = "Failed to score resumes due to an unexpected server error. Please try again.";
    if (error instanceof Error) {
        errorMessage = `Failed to score resumes: ${error.message}`;
    }
    
    return { error: errorMessage };
  }
}

export async function conductCandidateScreeningAction(
  input: ConductCandidateScreeningInput
): Promise<ConductCandidateScreeningOutput | { error: string }> {
  try {
    const result = await conductScreeningFlow(input);
    return result;
  } catch (error) {
    console.error("Error conducting candidate screening:", error);
    return { error: "Failed to conduct candidate screening. Please try again." };
  }
}

