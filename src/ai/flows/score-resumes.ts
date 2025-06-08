'use server';
/**
 * @fileOverview A resume scoring AI agent.
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

const ScoreResumesOutputSchema = z.array(
  z.object({
    resumeDataUri: z
      .string()
      .describe(
        "The resume's data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This should be the same as the input URI for the resume being scored."
      ),
    score: z.number().describe('The score of the resume, from 0 to 100. This field is mandatory.'),
    reason: z.string().describe('The reason for the score. This field is mandatory.'),
  })
);
export type ScoreResumesOutput = z.infer<typeof ScoreResumesOutputSchema>;

export async function scoreResumes(input: ScoreResumesInput): Promise<ScoreResumesOutput> {
  return scoreResumesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreResumesPrompt',
  input: {schema: ScoreResumesInputSchema},
  output: {schema: ScoreResumesOutputSchema},
  prompt: `You are an expert resume screening AI. Your task is to evaluate resumes against a provided job description.
For EACH resume submitted, you MUST return a JSON object containing a 'score', a 'reason' for that score, and the original 'resumeDataUri'.

First, determine the 'score'. The 'score' MUST be a number between 0 and 100. This field is MANDATORY for every resume.
Then, provide a 'reason'. The 'reason' MUST be a string explaining the score. This field is MANDATORY for every resume.
Finally, include the 'resumeDataUri'. The 'resumeDataUri' MUST be the exact data URI string provided for that resume in the input. This field is MANDATORY.

Job Description:
{{{jobDescription}}}

Resumes to process:
{{#each resumeDataUris}}
  Resume to score (Data URI): {{this}}
  Resume Content: {{media url=this}}
{{/each}}

OUTPUT FORMAT SPECIFICATION:
Your entire output MUST be a single valid JSON array.
Each element in the array MUST be a JSON object structured EXACTLY as follows:
{
  "score": <NUMBER_0_TO_100_MANDATORY>,
  "reason": "<STRING_EXPLANATION_MANDATORY>",
  "resumeDataUri": "<ORIGINAL_INPUT_DATA_URI_MANDATORY>"
}

Example for two resumes input:
[
  {
    "score": 85,
    "reason": "Strong alignment with required skills and experience.",
    "resumeDataUri": "data_uri_for_resume_1_from_input"
  },
  {
    "score": 60,
    "reason": "Some relevant experience but lacks depth in key areas.",
    "resumeDataUri": "data_uri_for_resume_2_from_input"
  }
]

CRITICAL FINAL INSTRUCTION: For every single resume provided in the input, your output object for that resume MUST include the 'score' field, and its value MUST be a number. DO NOT OMIT THE 'score' FIELD UNDER ANY CIRCUMSTANCES.`,
});

const scoreResumesFlow = ai.defineFlow(
  {
    name: 'scoreResumesFlow',
    inputSchema: ScoreResumesInputSchema,
    outputSchema: ScoreResumesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


    