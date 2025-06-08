// The AI flow for conducting initial text-based screenings of candidates.

'use server';

/**
 * @fileOverview Conducts initial text-based screenings of candidates.
 *
 * - conductCandidateScreening - A function that handles the candidate screening process.
 * - ConductCandidateScreeningInput - The input type for the conductCandidateScreening function.
 * - ConductCandidateScreeningOutput - The return type for the conductCandidateScreening function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConductCandidateScreeningInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the candidate\'s resume.'),
  jobDescription: z
    .string()
    .describe('The job description for the position.'),
  screeningQuestions: z
    .string()
    .describe('A comma separated list of screening questions to ask the candidate.'),
});
export type ConductCandidateScreeningInput = z.infer<
  typeof ConductCandidateScreeningInputSchema
>;

const ConductCandidateScreeningOutputSchema = z.object({
  pass: z
    .boolean()
    .describe(
      'Whether the candidate passed the initial screening based on their resume and answers to screening questions.'
    ),
  reason: z
    .string()
    .describe('The reason for the pass or fail decision.'),
  chatTranscript: z
    .string()
    .describe('The transcript of the chatbot screening conversation.'),
});
export type ConductCandidateScreeningOutput = z.infer<
  typeof ConductCandidateScreeningOutputSchema
>;

export async function conductCandidateScreening(
  input: ConductCandidateScreeningInput
): Promise<ConductCandidateScreeningOutput> {
  return conductCandidateScreeningFlow(input);
}

const screeningPrompt = ai.definePrompt({
  name: 'screeningPrompt',
  input: {schema: ConductCandidateScreeningInputSchema},
  output: {schema: ConductCandidateScreeningOutputSchema},
  prompt: `You are a virtual recruiter tasked with conducting initial screenings of job candidates.

  You will be provided with the candidate's resume text, the job description, and a list of screening questions.

  Your task is to simulate a text-based conversation with the candidate, asking the screening questions and evaluating their responses based on the job description and the content of their resume.

  After the conversation, you will make a pass/fail decision and provide a reason for your decision.

  Here's the candidate's resume:
  {{resumeText}}

  Here's the job description:
  {{jobDescription}}

  Here are the screening questions, comma separated:
  {{screeningQuestions}}

  Please conduct the screening and provide your decision. Keep your responses short, a sentence or two at most.

  Make sure the chatTranscript is complete.
  Output in JSON format:
  {{output}}`,
});

const conductCandidateScreeningFlow = ai.defineFlow(
  {
    name: 'conductCandidateScreeningFlow',
    inputSchema: ConductCandidateScreeningInputSchema,
    outputSchema: ConductCandidateScreeningOutputSchema,
  },
  async input => {
    const {output} = await screeningPrompt(input);
    return output!;
  }
);
