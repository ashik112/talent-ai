
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

export async function scoreResumes(input: ScoreResumesInput): Promise<ScoreResumesOutput> {
  const { jobDescription, resumeDataUris } = input;
  const numResumes = resumeDataUris.length;
  const allResults: ScoreResumesOutput = [];

  if (numResumes === 0) {
    return [];
  }

  // If PARALLEL_THRESHOLD or fewer resumes, process them individually in parallel for potentially faster individual feedback.
  if (numResumes <= PARALLEL_THRESHOLD) {
    console.log(`Processing ${numResumes} resumes individually in parallel.`);
    const promises = resumeDataUris.map(resumeDataUri =>
      scoreSingleResumeFlow({
        jobDescription: jobDescription,
        resumeDataUri
      })
    );
    try {
        const individualResults = await Promise.all(promises);
        return individualResults;
    } catch (error) {
        console.error('Error processing resumes individually in parallel:', error);
        return resumeDataUris.map(uri => ({
            resumeDataUri: uri,
            score: 0, // Error score
            reason: `Failed during parallel individual processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
    }
  }

  // For more than PARALLEL_THRESHOLD resumes, process in chunks using the batch flow.
  console.log(`Processing ${numResumes} resumes in chunks of up to ${CHUNK_SIZE}.`);
  for (let i = 0; i < numResumes; i += CHUNK_SIZE) {
    const chunk = resumeDataUris.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      console.log(`Processing chunk: ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(numResumes / CHUNK_SIZE)}, size: ${chunk.length}`);
      try {
        const chunkResults = await scoreResumesBatchProcessingFlow({ // Renamed flow for clarity
          jobDescription: jobDescription,
          resumeDataUris: chunk,
        });
        allResults.push(...chunkResults);
      } catch (error) {
        console.error(`Critical error processing chunk starting at index ${i}:`, error);
        const fallbackChunkResults = chunk.map(uri => ({
            resumeDataUri: uri,
            score: 0, // Error score
            reason: `Failed to process this resume in batch chunk due to a system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
        allResults.push(...fallbackChunkResults);
      }
    }
  }
  console.log(`Finished processing all ${numResumes} resumes. Total results generated: ${allResults.length}`);
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
    try {
      const {output} = await singleResumePrompt(input);
      
      if (!output || typeof output.score !== 'number' || typeof output.reason !== 'string' || typeof output.resumeDataUri !== 'string') {
        console.warn('Invalid or incomplete AI response for single resume. Output:', output);
        const score = (output && typeof output.score === 'number') ? output.score : 0;
        const reason = (output && typeof output.reason === 'string') ? output.reason : 'AI response was incomplete or malformed.';
        return {
          resumeDataUri: input.resumeDataUri, // Fallback to input URI
          score: Math.max(0, Math.min(100, Math.round(score))),
          reason: reason,
        };
      }
      
      return {
        resumeDataUri: output.resumeDataUri, // Prefer output URI
        score: Math.max(0, Math.min(100, Math.round(output.score))),
        reason: output.reason
      };
    } catch (error) {
      console.error(`Single resume scoring flow failed for URI starting with ${input.resumeDataUri.substring(0,50)}...:`, error);
      return {
        resumeDataUri: input.resumeDataUri,
        score: 0, // Error score
        reason: `Error during single resume analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please review manually.`
      };
    }
  }
);

// Prompt for scoring a batch of resumes
const scoreResumesBatchPrompt = ai.definePrompt({
  name: 'scoreResumesBatchPrompt',
  input: {schema: ScoreResumesInputSchema}, // Expects an array of resumeDataUris
  output: {schema: ScoreResumesOutputSchema}, // Expects an array of results
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
    try {
      const {output} = await scoreResumesBatchPrompt(input); // Uses the batch prompt
      
      if (!output || !Array.isArray(output)) {
        console.warn('AI response for batch was not a valid array. Input URIs count:', input.resumeDataUris.length, 'Output:', output);
        throw new Error('AI response for batch was not a valid array');
      }
      
      const validatedResults: ScoreResumesOutput = [];
      
      // Match results to input URIs to ensure correctness and completeness
      for (const inputUri of input.resumeDataUris) {
        const aiResult = output.find(o => o.resumeDataUri === inputUri);

        if (aiResult && typeof aiResult.score === 'number' && typeof aiResult.reason === 'string') {
          validatedResults.push({
            resumeDataUri: inputUri, // Ensure we use the input URI
            score: Math.max(0, Math.min(100, Math.round(aiResult.score))),
            reason: aiResult.reason
          });
        } else {
          console.warn(`Missing or invalid fields for resume ${inputUri.substring(0,50)}... in batch. AI Result found:`, aiResult, 'Full AI output for batch:', output);
          validatedResults.push({
            resumeDataUri: inputUri,
            score: 0, // Error score
            reason: 'AI response for this resume in batch was incomplete, malformed, or URI mismatch.'
          });
        }
      }
      
      // If AI returned more or fewer items than expected, log it.
      if (output.length !== input.resumeDataUris.length) {
          console.warn(`AI returned ${output.length} items for a batch of ${input.resumeDataUris.length} resumes. Results were mapped to input URIs.`);
      }

      return validatedResults;
    } catch (error) {
      console.error(`Batch scoring flow failed for chunk with URIs starting: ${input.resumeDataUris.map(u => u.substring(0,30) + '...').join(', ')}:`, error);
      return input.resumeDataUris.map(resumeDataUri => ({
        resumeDataUri,
        score: 0, // Error score
        reason: `Error during batch resume analysis for this chunk: ${error instanceof Error ? error.message : 'Unknown error'}. Please review manually.`
      }));
    }
  }
);

