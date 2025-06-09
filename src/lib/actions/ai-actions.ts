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
    
    console.log(`Starting to score ${input.resumeDataUris.length} resumes`);
    const result = await scoreResumesFlow(input);
    console.log(`Successfully scored ${result.length} resumes`);
    
    return result;
  } catch (error) {
    console.error("Error scoring resumes:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to score resumes. Please try again.";
    
    if (error instanceof Error) {
      if (error.message.includes('Schema validation failed')) {
        errorMessage = "The AI response format was invalid. This might be due to complex resumes or job descriptions. Please try with simpler content or fewer resumes at once.";
      } else if (error.message.includes('score field is missing')) {
        errorMessage = "The AI failed to provide scores for all resumes. Please try again or contact support if the issue persists.";
      } else if (error.message.includes('Expected') && error.message.includes('resume scores')) {
        errorMessage = "The AI didn't process all resumes. Please try again with fewer resumes or simpler content.";
      } else {
        errorMessage = `Failed to score resumes: ${error.message}`;
      }
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
