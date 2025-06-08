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
For EACH resume submitted, you MUST return a JSON object.

Job Description:
{{{jobDescription}}}

Resumes to process:
{{#each resumeDataUris}}
  Resume to score (Data URI): {{this}}
  Resume Content: {{media url=this}}
{{/each}}

OUTPUT FORMAT SPECIFICATION:
Your entire output MUST be a single valid JSON array. Each object in the array corresponds to one resume and MUST contain the following three fields in this exact order:
1.  \`score\`: A number between 0 and 100. This field is MANDATORY.
2.  \`reason\`: A string explaining the score. This field is MANDATORY.
3.  \`resumeDataUri\`: The original data URI of the resume as provided in the input. This field is MANDATORY.

Example of the JSON structure for a single resume object:
{
  "score": 85,
  "reason": "Detailed explanation for the score, referencing specific skills from the resume and how they align or misalign with the job description.",
  "resumeDataUri": "data:application/pdf;base64,..."
}

If there are multiple resumes, your output will be an array of such objects:
[
  {
    "score": 90,
    "reason": "Excellent match for resume 1. Strong skills in X, Y, and Z as per job description.",
    "resumeDataUri": "data_uri_for_resume_1_from_input"
  },
  {
    "score": 75,
    "reason": "Good fit for resume 2. Relevant experience in A, but lacks B.",
    "resumeDataUri": "data_uri_for_resume_2_from_input"
  }
]

CRITICALLY IMPORTANT:
- The 'score' field MUST be present in every JSON object you return for each resume.
- The 'score' field MUST be a numerical value (e.g., 78, not "78").
- The 'reason' field MUST provide a justification for the score.
- The 'resumeDataUri' MUST be the exact string provided in the input for that resume.
DO NOT OMIT THE 'score' FIELD UNDER ANY CIRCUMSTANCES. Ensure every resume object has a 'score'.`,
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
