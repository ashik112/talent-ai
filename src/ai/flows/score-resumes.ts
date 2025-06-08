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
  prompt: `You are an expert recruiter specializing in scoring resumes against a job description.
You will be provided with a jobDescription and a list of resumes (as data URIs).
For EACH resume provided in the 'resumeDataUris' input array, you MUST evaluate it against the 'jobDescription' and produce a corresponding object in the output JSON array.

Job Description:
{{{jobDescription}}}

Resumes to score:
{{#each resumeDataUris}}
  Resume ({{@index}}):
  Data URI: {{this}}
  Content: {{media url=this}}
{{/each}}

CRITICAL INSTRUCTIONS FOR OUTPUT FORMAT:
Your output MUST be a valid JSON array.
EACH object in this array represents a single resume and MUST contain the following fields:
1. \`resumeDataUri\`: STRING - The exact data URI of the resume, exactly as it was provided in the input for that resume. This field MUST be present.
2. \`score\`: NUMBER - A numerical score from 0 to 100 (inclusive), representing the resume's match to the job description. This field is ABSOLUTELY MANDATORY and MUST be a number for every resume processed. DO NOT OMIT THIS FIELD.
3. \`reason\`: STRING - A brief explanation for the assigned score. This field MUST be present.

Example of a single object within the output array:
{
  "resumeDataUri": "data:application/pdf;base64,JVBERi0xLjc...",
  "score": 75,
  "reason": "Good match for skills X and Y, but lacks experience in Z."
}

If multiple resumes are provided in the input, your output JSON array should contain an object for each one, and EACH of those objects MUST include the 'score' field as a number.
For example, if two resumes are input, the output should look like:
[
  {
    "resumeDataUri": "data_uri_for_resume_1",
    "score": 80,
    "reason": "Reason for score of resume 1..."
  },
  {
    "resumeDataUri": "data_uri_for_resume_2",
    "score": 65,
    "reason": "Reason for score of resume 2..."
  }
]

Ensure every resume processed has a 'score' field that is a number. Do not omit the 'score' field under any circumstances for any resume.`,
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
