"use client";

import { useState, type ChangeEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { scoreResumesAction } from "@/lib/actions/ai-actions";
import { fileToDataURI } from "@/lib/file-utils";
import type { ScoreResumesInput, ScoreResumesOutput } from "@/ai/flows/score-resumes";
import { ScoreCard } from "./score-card";
import { Loader2, FileUp } from "lucide-react";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

const formSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
  resumes: z.custom<FileList>((val) => val instanceof FileList && val.length > 0, "At least one resume file is required.")
    .refine((files) => files.length <= MAX_FILES, `You can upload a maximum of ${MAX_FILES} files.`)
    .refine((files) => Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Each file must be less than ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine((files) => Array.from(files).every(file => ALLOWED_FILE_TYPES.includes(file.type)), "Only PDF, DOCX, and TXT files are allowed."),
});

type FormData = z.infer<typeof formSchema>;

interface ScoredResume {
  fileName: string;
  score: number;
  reason: string;
}

export function ResumeScoringForm() {
  const [scoredResumes, setScoredResumes] = useState<ScoredResume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(filesArray);
      setValue("resumes", event.target.files, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setScoredResumes([]);

    try {
      const resumeDataUris = await Promise.all(
        Array.from(data.resumes).map(file => fileToDataURI(file))
      );

      const input: ScoreResumesInput = {
        jobDescription: data.jobDescription,
        resumeDataUris,
      };

      const result = await scoreResumesAction(input);
      setIsLoading(false);

      if ("error" in result) {
        toast({
          title: "Error Scoring Resumes",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const fileNames = Array.from(data.resumes).map(file => file.name);
        const updatedScoredResumes = (result as ScoreResumesOutput).map((item, index) => ({
          // The AI flow might not return filenames, so we use original filenames
          fileName: fileNames[index] || `Resume ${index + 1}`, 
          score: item.score,
          reason: item.reason,
        })).sort((a, b) => b.score - a.score); // Sort by score descending
        
        setScoredResumes(updatedScoredResumes);
        toast({
          title: "Success",
          description: "Resumes scored successfully.",
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing files.",
        variant: "destructive",
      });
      console.error("File processing error:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-primary">Score Resumes</CardTitle>
          <CardDescription>Upload resumes and provide a job description to get AI-powered fit scores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="jobDescription" className="font-semibold">Job Description</Label>
              <Textarea
                id="jobDescription"
                {...register("jobDescription")}
                placeholder="Paste the full job description here..."
                className="mt-1 min-h-[150px]"
                aria-invalid={errors.jobDescription ? "true" : "false"}
              />
              {errors.jobDescription && <p className="text-sm text-destructive mt-1">{errors.jobDescription.message}</p>}
            </div>

            <div>
              <Label htmlFor="resumes" className="font-semibold">Upload Resumes (PDF, DOCX, TXT)</Label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                <div className="text-center">
                  <FileUp className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <label
                      htmlFor="resumes"
                      className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>Upload files</span>
                      <Input 
                        id="resumes" 
                        type="file" 
                        className="sr-only" 
                        multiple 
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        aria-invalid={errors.resumes ? "true" : "false"}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Max {MAX_FILES} files, up to {MAX_FILE_SIZE / (1024*1024)}MB each</p>
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {selectedFiles.map(file => file.name).join(", ")}
                    </div>
                  )}
                </div>
              </div>
              {errors.resumes && <p className="text-sm text-destructive mt-1">{errors.resumes.message as string}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Score Resumes
              </Button>
              <Button type="button" variant="outline" onClick={() => { reset(); setSelectedFiles([]); setScoredResumes([]); }} className="w-full sm:w-auto" disabled={isLoading}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && !scoredResumes.length && (
        <div className="mt-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Scoring resumes, please wait...</p>
        </div>
      )}

      {scoredResumes.length > 0 && !isLoading && (
        <div className="mt-8">
          <h2 className="text-xl font-headline font-semibold mb-4 text-primary">Scoring Results</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scoredResumes.map((resume, index) => (
              <ScoreCard
                key={index}
                fileName={resume.fileName}
                score={resume.score}
                reason={resume.reason}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
