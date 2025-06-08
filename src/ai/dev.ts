import { config } from 'dotenv';
config();

import '@/ai/flows/conduct-candidate-screening.ts';
import '@/ai/flows/score-resumes.ts';
import '@/ai/flows/generate-job-description.ts';