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
  try {
    // Basic validation, can be enhanced with Zod schema if needed here too
    if (!input.jobDescription || input.resumeDataUris.length === 0) {
      return { error: "Job description and at least one resume are required." };
    }
    const result = await scoreResumesFlow(input);
    return result;
  } catch (error)
  {
    console.error("Error scoring resumes:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to score resumes: ${errorMessage}. Please try again.` };
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
