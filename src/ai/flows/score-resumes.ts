
'use server';
/**
 * @fileOverview A resume scoring AI agent with parallel processing for better performance and chunking for large inputs.
 *
 * - scoreResumes - A function that handles the resume scoring process.
 * - ScoreResumesInput - The input type for the scoreResumes function.
 * - ScoreResumesOutput - The return type for the scoreResumes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScoreResumesInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description to score the resumes against.'),
  resumeDataUris: z.array(
    z
      .string()
      .describe(
        "A list of resumes, as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      )
  ),
});
export type ScoreResumesInput = z.infer<typeof ScoreResumesInputSchema>;

// Schema for scoring a single resume
const ScoreSingleResumeInputSchema = z.object({
  jobDescription: z.string(),
  resumeDataUri: z.string().describe(
    "A resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});

const ScoreSingleResumeOutputSchema = z.object({
  resumeDataUri: z.string().describe("The resume's data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  score: z.number().describe('The score of the resume, from 0 to 100.'),
  reason: z.string().describe('The reason for the score.'),
});
// Type for single resume output, can be inferred or explicit
export type ScoreSingleResumeOutput = z.infer<typeof ScoreSingleResumeOutputSchema>;


const ScoreResumesOutputSchema = z.array(ScoreSingleResumeOutputSchema);
export type ScoreResumesOutput = z.infer<typeof ScoreResumesOutputSchema>;


const CHUNK_SIZE = 5; // Process up to 5 resumes at a time in a single batch call to the LLM
const PARALLEL_THRESHOLD = 3; // Process up to 3 resumes individually in parallel

export async function scoreResumes(input: ScoreResumesInput): Promise<ScoreResumesOutput | { error: string }> {
  console.log(`[scoreResumes flow] Received request to score ${input.resumeDataUris.length} resumes.`);
  console.time("[scoreResumes flow] Total execution time");

  const { jobDescription, resumeDataUris } = input;
  const numResumes = resumeDataUris.length;
  const allResults: ScoreResumesOutput = [];

  if (numResumes === 0) {
    console.log("[scoreResumes flow] No resumes provided, returning empty array.");
    console.timeEnd("[scoreResumes flow] Total execution time");
    return [];
  }

  // If PARALLEL_THRESHOLD or fewer resumes, process them individually in parallel for potentially faster individual feedback.
  if (numResumes <= PARALLEL_THRESHOLD) {
    console.log(`[scoreResumes flow] Processing ${numResumes} resumes individually in parallel (threshold: ${PARALLEL_THRESHOLD}).`);
    console.time("[scoreResumes flow] Parallel individual processing time");
    const promises = resumeDataUris.map(resumeDataUri =>
      scoreSingleResumeFlow({
        jobDescription: jobDescription,
        resumeDataUri
      })
    );
    try {
        const individualResults = await Promise.all(promises);
        console.timeEnd("[scoreResumes flow] Parallel individual processing time");
        console.log(`[scoreResumes flow] Finished parallel individual processing. Results count: ${individualResults.length}`);
        console.timeEnd("[scoreResumes flow] Total execution time");
        return individualResults;
    } catch (error) {
        console.error('[scoreResumes flow] Error processing resumes individually in parallel:', error);
        console.timeEnd("[scoreResumes flow] Parallel individual processing time");
        console.timeEnd("[scoreResumes flow] Total execution time");
        return { error: `Failed during parallel individual processing: ${error instanceof Error ? error.message : 'Unknown error'}`};
    }
  }

  // For more than PARALLEL_THRESHOLD resumes, process in chunks using the batch flow.
  console.log(`[scoreResumes flow] Processing ${numResumes} resumes in chunks of up to ${CHUNK_SIZE}.`);
  for (let i = 0; i < numResumes; i += CHUNK_SIZE) {
    const chunk = resumeDataUris.slice(i, i + CHUNK_SIZE);
    const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(numResumes / CHUNK_SIZE);

    if (chunk.length > 0) {
      console.log(`[scoreResumes flow] Processing chunk: ${chunkNumber} of ${totalChunks}, size: ${chunk.length}`);
      console.time(`[scoreResumes flow] Chunk ${chunkNumber} processing time`);
      try {
        const chunkResults = await scoreResumesBatchProcessingFlow({
          jobDescription: jobDescription,
          resumeDataUris: chunk,
        });
        allResults.push(...chunkResults);
        console.timeEnd(`[scoreResumes flow] Chunk ${chunkNumber} processing time`);
        console.log(`[scoreResumes flow] Finished processing chunk ${chunkNumber}. Results in chunk: ${chunkResults.length}`);
      } catch (error) {
        console.error(`[scoreResumes flow] Critical error processing chunk ${chunkNumber} (starting at index ${i}):`, error);
        console.timeEnd(`[scoreResumes flow] Chunk ${chunkNumber} processing time`);
        // We add fallback results for the failed chunk to maintain overall structure if desired,
        // or we could throw and fail the whole operation. For now, returning error objects for failed items.
        const fallbackChunkResults = chunk.map(uri => ({
            resumeDataUri: uri,
            score: 0, 
            reason: `Failed to process this resume in batch chunk ${chunkNumber} due to a system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
        allResults.push(...fallbackChunkResults);
      }
    }
  }
  console.log(`[scoreResumes flow] Finished processing all ${numResumes} resumes. Total results generated: ${allResults.length}`);
  console.timeEnd("[scoreResumes flow] Total execution time");
  return allResults;
}

// Prompt for single resume scoring
const singleResumePrompt = ai.definePrompt({
  name: 'scoreSingleResumePrompt',
  input: {schema: ScoreSingleResumeInputSchema},
  output: {schema: ScoreSingleResumeOutputSchema},
  prompt: `You are an expert resume screener. Your task is to score the provided resume against the given job description.
Return a valid JSON object that MUST contain these three fields:
1. "resumeDataUri": (string) The exact data URI of the resume provided: {{{resumeDataUri}}}
2. "score": (number) A score from 0 to 100. This field is MANDATORY and MUST be a number.
3. "reason": (string) A brief explanation for the score, max 150 characters.

Job Description:
{{{jobDescription}}}

Resume to evaluate:
{{media url=resumeDataUri}}

CRITICAL: Ensure your output is a single, valid JSON object. The object MUST have "score", "reason", and "resumeDataUri".
The "score" MUST be a number between 0 and 100.
Example output: {"resumeDataUri": "{{{resumeDataUri}}}", "score": 75, "reason": "Good fit based on relevant experience."}
Return only the JSON object, no other text.`,
});

// Flow for single resume scoring
const scoreSingleResumeFlow = ai.defineFlow(
  {
    name: 'scoreSingleResumeFlow',
    inputSchema: ScoreSingleResumeInputSchema,
    outputSchema: ScoreSingleResumeOutputSchema,
  },
  async (input: ScoreSingleResumeInput): Promise<ScoreSingleResumeOutput> => {
    const shortUri = input.resumeDataUri.substring(0,70) + '...';
    console.log(`[scoreSingleResumeFlow] Starting for resume: ${shortUri}`);
    console.time(`[scoreSingleResumeFlow] LLM call for ${shortUri}`);
    try {
      const {output} = await singleResumePrompt(input);
      console.timeEnd(`[scoreSingleResumeFlow] LLM call for ${shortUri}`);
      
      if (!output || typeof output.score !== 'number' || typeof output.reason !== 'string' || typeof output.resumeDataUri !== 'string') {
        console.warn(`[scoreSingleResumeFlow] Invalid or incomplete AI response for single resume ${shortUri}. Output:`, output);
        const score = (output && typeof output.score === 'number') ? output.score : 0;
        const reason = (output && typeof output.reason === 'string') ? output.reason : 'AI response was incomplete or malformed.';
        // Construct and return an error-like object or throw, ensuring the promise resolves to the defined output type.
        // For now, we'll return a "failed" score as per previous logic.
        return {
          resumeDataUri: input.resumeDataUri, 
          score: Math.max(0, Math.min(100, Math.round(score))),
          reason: reason,
        };
      }
      
      console.log(`[scoreSingleResumeFlow] Successfully processed resume: ${shortUri}`);
      return {
        resumeDataUri: output.resumeDataUri, 
        score: Math.max(0, Math.min(100, Math.round(output.score))),
        reason: output.reason
      };
    } catch (error) {
      console.timeEnd(`[scoreSingleResumeFlow] LLM call for ${shortUri}`);
      console.error(`[scoreSingleResumeFlow] Failed for URI ${shortUri}:`, error);
      // Ensure the return type matches ScoreSingleResumeOutput even in error cases.
      return {
        resumeDataUri: input.resumeDataUri,
        score: 0, 
        reason: `Error during single resume analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please review manually.`
      };
    }
  }
);

// Prompt for scoring a batch of resumes
const scoreResumesBatchPrompt = ai.definePrompt({
  name: 'scoreResumesBatchPrompt',
  input: {schema: ScoreResumesInputSchema}, 
  output: {schema: ScoreResumesOutputSchema}, 
  prompt: `You are an expert resume screener. Your task is to score EACH of the provided resumes against the given job description.
For EACH resume, you MUST determine a score and a reason.
Return a valid JSON array, where EACH object in the array corresponds to one resume and MUST contain these three fields, in this exact order:
1. "resumeDataUri": (string) The exact data URI of the resume as it was provided in the input for that specific resume.
2. "score": (number) A numerical score from 0 to 100. This field is ABSOLUTELY MANDATORY for every resume.
3. "reason": (string) A brief explanation for the score, maximum 150 characters.

Job Description:
{{{jobDescription}}}

Resumes to evaluate (process each one):
{{#each resumeDataUris}}
Resume (Input URI: {{this}}):
{{media url=this}}
---
{{/each}}

CRITICAL: Your output MUST be a single, valid JSON array. Each object in the array MUST represent one resume and MUST contain "resumeDataUri", "score", and "reason".
The "score" field is MANDATORY for every object. The "resumeDataUri" in your output MUST EXACTLY MATCH the corresponding input "resumeDataUri" for each resume.
Example for one resume object within the array: {"resumeDataUri": "data:...", "score": 75, "reason": "Good fit."}
If multiple resumes are provided, the output must be an array of such objects, e.g., [ {"resumeDataUri": "data:uri1", "score": 80, "reason": "..."}, {"resumeDataUri": "data:uri2", "score": 65, "reason": "..."} ]
Return ONLY the JSON array, with no other text or explanations outside the JSON structure.`,
});

// Flow for processing a batch of resumes (called by the main scoreResumes function for chunks)
const scoreResumesBatchProcessingFlow = ai.defineFlow(
  {
    name: 'scoreResumesBatchProcessingFlow',
    inputSchema: ScoreResumesInputSchema,
    outputSchema: ScoreResumesOutputSchema,
  },
  async (input: ScoreResumesInput): Promise<ScoreResumesOutput> => {
    const firstUriShort = input.resumeDataUris.length > 0 ? input.resumeDataUris[0].substring(0,50) + '...' : 'N/A';
    console.log(`[scoreResumesBatchProcessingFlow] Starting for a batch of ${input.resumeDataUris.length} resumes. First URI starts: ${firstUriShort}`);
    console.time(`[scoreResumesBatchProcessingFlow] LLM call for batch starting with ${firstUriShort}`);
    try {
      const {output} = await scoreResumesBatchPrompt(input); 
      console.timeEnd(`[scoreResumesBatchProcessingFlow] LLM call for batch starting with ${firstUriShort}`);
      
      if (!output || !Array.isArray(output)) {
        console.warn('[scoreResumesBatchProcessingFlow] AI response for batch was not a valid array. Input URIs count:', input.resumeDataUris.length, 'Output:', output);
        // Fallback: return an array of error objects, one for each input URI
        return input.resumeDataUris.map(uri => ({
            resumeDataUri: uri,
            score: 0,
            reason: 'AI response for batch was not a valid array or was empty.'
        }));
      }
      
      const validatedResults: ScoreResumesOutput = [];
      
      for (const inputUri of input.resumeDataUris) {
        const aiResult = output.find(o => o.resumeDataUri === inputUri);

        if (aiResult && typeof aiResult.score === 'number' && typeof aiResult.reason === 'string') {
          validatedResults.push({
            resumeDataUri: inputUri, 
            score: Math.max(0, Math.min(100, Math.round(aiResult.score))),
            reason: aiResult.reason
          });
        } else {
          console.warn(`[scoreResumesBatchProcessingFlow] Missing or invalid fields for resume ${inputUri.substring(0,50)}... in batch. AI Result found:`, aiResult, 'Full AI output for batch:', output);
          validatedResults.push({
            resumeDataUri: inputUri,
            score: 0, 
            reason: 'AI response for this resume in batch was incomplete, malformed, or URI mismatch.'
          });
        }
      }
      
      if (output.length !== input.resumeDataUris.length) {
          console.warn(`[scoreResumesBatchProcessingFlow] AI returned ${output.length} items for a batch of ${input.resumeDataUris.length} resumes. Results were mapped to input URIs.`);
      }
      
      console.log(`[scoreResumesBatchProcessingFlow] Successfully processed batch. Validated results count: ${validatedResults.length}`);
      return validatedResults;

    } catch (error) {
      console.timeEnd(`[scoreResumesBatchProcessingFlow] LLM call for batch starting with ${firstUriShort}`);
      console.error(`[scoreResumesBatchProcessingFlow] Failed for batch starting with ${firstUriShort}:`, error);
      return input.resumeDataUris.map(resumeDataUri => ({
        resumeDataUri,
        score: 0, 
        reason: `Error during batch resume analysis for this chunk: ${error instanceof Error ? error.message : 'Unknown error'}. Please review manually.`
      }));
    }
  }
);

