
"use client";

import { useState, type ChangeEvent, useRef } from "react";
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
import { Loader2, FileUp, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MAX_FILES = 10; // Increased max files based on chunking
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    trigger, 
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const combinedFiles = [...selectedFiles, ...newFiles].slice(0, MAX_FILES); // Enforce MAX_FILES limit
      setSelectedFiles(combinedFiles);
      
      // Update react-hook-form FileList
      const dataTransfer = new DataTransfer();
      combinedFiles.forEach(file => dataTransfer.items.add(file));
      setValue("resumes", dataTransfer.files, { shouldValidate: true });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    setValue("resumes", dataTransfer.files.length > 0 ? dataTransfer.files : null as unknown as FileList, { shouldValidate: true });
     if (newFiles.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the actual input element
    }
    trigger("resumes"); // Re-validate after removing a file
  };
  
  const resetForm = () => {
    reset();
    setSelectedFiles([]);
    setScoredResumes([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setScoredResumes([]);

    if (!data.resumes || data.resumes.length === 0) {
        toast({
            title: "No Resumes Selected",
            description: "Please select resume files to score.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }


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
         const updatedScoredResumes = (result as ScoreResumesOutput).map((item, index) => {
            const originalFile = selectedFiles.find(f => fileToDataURI(f).then(uri => uri === item.resumeDataUri));
            // Match result to input file by data URI if possible, otherwise by index as fallback
            let fileName = fileNames[index] || `Resume ${index + 1}`; // Fallback by index
            
            // Try to find the original filename by matching Data URI
            const matchedFile = selectedFiles.find(sf => {
                // This is tricky because fileToDataURI is async. 
                // For now, we rely on the order or a simpler matching.
                // A better way would be to pass originalFileNames along with dataUris.
                // Assuming the order is maintained by the AI flow for now.
                return true; 
            });
            if(item.resumeDataUri){
                // Find the original file name whose data URI matches the one in the result
                const originalFileIndex = resumeDataUris.indexOf(item.resumeDataUri);
                if(originalFileIndex !== -1 && fileNames[originalFileIndex]){
                    fileName = fileNames[originalFileIndex];
                }
            }

            return {
                fileName: fileName,
                score: item.score,
                reason: item.reason,
            };
        }).sort((a, b) => b.score - a.score); // Sort by score descending
        
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
        description: `An error occurred while processing files. ${error instanceof Error ? error.message : ''}`,
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
          <CardDescription>Upload resumes (PDF, DOCX, TXT) and provide a job description for AI-powered fit scores. Max {MAX_FILES} files.</CardDescription>
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
              <Label htmlFor="resumes-upload" className="font-semibold">Upload Resumes</Label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                <div className="text-center">
                  <FileUp className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <label
                      htmlFor="resumes-upload"
                      className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>Choose files</span>
                      <Input 
                        id="resumes-upload" // Changed ID to avoid conflict with register
                        type="file" 
                        className="sr-only" 
                        multiple 
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        ref={fileInputRef} // Use ref for clearing
                        aria-invalid={errors.resumes ? "true" : "false"}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Max {MAX_FILES} files, up to {MAX_FILE_SIZE / (1024*1024)}MB each. PDF, DOCX, TXT.</p>
                </div>
              </div>
              {/* This hidden input is what react-hook-form will use for validation based on selectedFiles */}
               <input type="file" {...register("resumes")} className="hidden" multiple accept=".pdf,.doc,.docx,.txt" />
              {errors.resumes && <p className="text-sm text-destructive mt-1">{errors.resumes.message as string}</p>}
            </div>
            
            {selectedFiles.length > 0 && (
              <div>
                <Label className="font-semibold">Selected Files ({selectedFiles.length}):</Label>
                <div className="mt-2 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <span className="text-sm text-foreground truncate" title={file.name}>{file.name}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Remove {file.name}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || selectedFiles.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Score Resumes
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto" disabled={isLoading}>
                Clear All
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && ( // Show loading indicator prominently
        <div className="mt-8 text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-primary">Scoring resumes...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments, especially for multiple files.</p>
        </div>
      )}

      {scoredResumes.length > 0 && !isLoading && (
        <div className="mt-8">
          <h2 className="text-xl font-headline font-semibold mb-4 text-primary">Scoring Results ({scoredResumes.length} {scoredResumes.length === 1 ? 'Resume' : 'Resumes'})</h2>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scoredResumes.map((resume, index) => (
              <ScoreCard
                key={`${resume.fileName}-${index}`} // Ensure unique key
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

