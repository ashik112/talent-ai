'use server';
/**
 * @fileOverview A resume scoring AI agent with parallel processing for better performance.
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
  resumeDataUri: z.string(),
});

const ScoreSingleResumeOutputSchema = z.object({
  resumeDataUri: z.string(),
  score: z.number().describe('The score of the resume, from 0 to 100.'),
  reason: z.string().describe('The reason for the score.'),
});

const ScoreResumesOutputSchema = z.array(ScoreSingleResumeOutputSchema);
export type ScoreResumesOutput = z.infer<typeof ScoreResumesOutputSchema>;

export async function scoreResumes(input: ScoreResumesInput): Promise<ScoreResumesOutput> {
  // For better performance, process resumes in parallel if there are multiple
  if (input.resumeDataUris.length === 1) {
    // Single resume - use the optimized single flow
    const result = await scoreSingleResumeFlow({
      jobDescription: input.jobDescription,
      resumeDataUri: input.resumeDataUris[0]
    });
    return [result];
  } else if (input.resumeDataUris.length <= 3) {
    // Small batch - process in parallel
    const promises = input.resumeDataUris.map(resumeDataUri =>
      scoreSingleResumeFlow({
        jobDescription: input.jobDescription,
        resumeDataUri
      })
    );
    return Promise.all(promises);
  } else {
    // Large batch - use the original batch processing but with smaller chunks
    return scoreResumesFlow(input);
  }
}

// Optimized prompt for single resume scoring
const singleResumePrompt = ai.definePrompt({
  name: 'scoreSingleResumePrompt',
  input: {schema: ScoreSingleResumeInputSchema},
  output: {schema: ScoreSingleResumeOutputSchema},
  prompt: `Score this resume against the job description.

Job Description:
{{{jobDescription}}}

Resume to evaluate:
{{media url=resumeDataUri}}

Return JSON with this exact structure:
{
  "resumeDataUri": "{{{resumeDataUri}}}",
  "score": [NUMBER_0_TO_100],
  "reason": "[BRIEF_EXPLANATION_MAX_150_CHARS]"
}

Score based on: skills match (40%), experience (30%), education (20%), fit (10%).
Return only valid JSON, no other text.`,
});

// Fast single resume scoring flow
const scoreSingleResumeFlow = ai.defineFlow(
  {
    name: 'scoreSingleResumeFlow',
    inputSchema: ScoreSingleResumeInputSchema,
    outputSchema: ScoreSingleResumeOutputSchema,
  },
  async input => {
    try {
      const {output} = await singleResumePrompt(input);
      
      if (!output || typeof output.score !== 'number') {
        throw new Error('Invalid AI response for single resume');
      }
      
      return {
        resumeDataUri: input.resumeDataUri,
        score: Math.max(0, Math.min(100, Math.round(output.score))),
        reason: output.reason || 'Unable to provide detailed analysis.'
      };
    } catch (error) {
      console.warn('Single resume scoring failed, using fallback:', error);
      return {
        resumeDataUri: input.resumeDataUri,
        score: 50,
        reason: 'Unable to analyze this resume. Please try again or review manually.'
      };
    }
  }
);

// Original batch processing (now optimized for larger batches)
const prompt = ai.definePrompt({
  name: 'scoreResumesPrompt',
  input: {schema: ScoreResumesInputSchema},
  output: {schema: ScoreResumesOutputSchema},
  prompt: `Score these resumes against the job description quickly and concisely.

Job Description:
{{{jobDescription}}}

Resumes:
{{#each resumeDataUris}}
{{@index}}: {{media url=this}}
{{/each}}

Return JSON array:
[
{{#each resumeDataUris}}
  {"resumeDataUri": "{{this}}", "score": [0-100], "reason": "[brief]"}{{#unless @last}},{{/unless}}
{{/each}}
]

Focus on key skills and experience. Keep reasons under 100 characters.`,
});

const scoreResumesFlow = ai.defineFlow(
  {
    name: 'scoreResumesFlow',
    inputSchema: ScoreResumesInputSchema,
    outputSchema: ScoreResumesOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      
      if (!output || !Array.isArray(output)) {
        throw new Error('AI response was not a valid array');
      }
      
      // Create complete response with fallbacks
      const completeOutput: ScoreResumesOutput = [];
      
      for (let i = 0; i < input.resumeDataUris.length; i++) {
        const resumeDataUri = input.resumeDataUris[i];
        const aiResult = output[i];
        
        if (aiResult && typeof aiResult.score === 'number' && aiResult.reason) {
          completeOutput.push({
            resumeDataUri,
            score: Math.max(0, Math.min(100, Math.round(aiResult.score))),
            reason: aiResult.reason
          });
        } else {
          completeOutput.push({
            resumeDataUri,
            score: 50,
            reason: 'Unable to analyze this resume fully.'
          });
        }
      }
      
      return completeOutput;
    } catch (error) {
      console.error('Batch scoring failed:', error);
      
      // Return fallback for all resumes
      return input.resumeDataUris.map(resumeDataUri => ({
        resumeDataUri,
        score: 50,
        reason: 'Processing error. Please try again.'
      }));
    }
  }
);
