"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { conductCandidateScreeningAction } from "@/lib/actions/ai-actions";
import type { ConductCandidateScreeningInput, ConductCandidateScreeningOutput } from "@/ai/flows/conduct-candidate-screening";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  resumeText: z.string().min(100, "Resume text must be at least 100 characters."),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
  screeningQuestions: z.string().min(10, "Please provide at least one screening question.").regex(/^(?!.*,$).*/, "Questions should be comma-separated and not end with a comma."),
});

type FormData = z.infer<typeof formSchema>;

export function CandidateScreeningForm() {
  const [screeningResult, setScreeningResult] = useState<ConductCandidateScreeningOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setScreeningResult(null);
    
    const result = await conductCandidateScreeningAction(data as ConductCandidateScreeningInput);
    setIsLoading(false);

    if ("error" in result) {
      toast({
        title: "Error Conducting Screening",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setScreeningResult(result as ConductCandidateScreeningOutput);
      toast({
        title: "Success",
        description: "Candidate screening completed.",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-primary">Conduct Candidate Screening</CardTitle>
          <CardDescription>Provide resume text, job description, and questions for AI-powered initial screening.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="resumeText" className="font-semibold">Resume Text</Label>
              <Textarea
                id="resumeText"
                {...register("resumeText")}
                placeholder="Paste the candidate's full resume text here..."
                className="mt-1 min-h-[150px]"
                aria-invalid={errors.resumeText ? "true" : "false"}
              />
              {errors.resumeText && <p className="text-sm text-destructive mt-1">{errors.resumeText.message}</p>}
            </div>

            <div>
              <Label htmlFor="jobDescription" className="font-semibold">Job Description</Label>
              <Textarea
                id="jobDescription"
                {...register("jobDescription")}
                placeholder="Paste the full job description here..."
                className="mt-1 min-h-[120px]"
                aria-invalid={errors.jobDescription ? "true" : "false"}
              />
              {errors.jobDescription && <p className="text-sm text-destructive mt-1">{errors.jobDescription.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="screeningQuestions" className="font-semibold">Screening Questions (comma-separated)</Label>
              <Input
                id="screeningQuestions"
                {...register("screeningQuestions")}
                placeholder="e.g., What are your salary expectations?, Describe your experience with X."
                className="mt-1"
                aria-invalid={errors.screeningQuestions ? "true" : "false"}
              />
              {errors.screeningQuestions && <p className="text-sm text-destructive mt-1">{errors.screeningQuestions.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start Screening
                </Button>
                 <Button type="button" variant="outline" onClick={() => { reset(); setScreeningResult(null); }} className="w-full sm:w-auto" disabled={isLoading}>
                    Clear
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Screening in progress...</p>
          </div>
        </Card>
      )}

      {screeningResult && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-primary">Screening Result</CardTitle>
                <Badge variant={screeningResult.pass ? "default" : "destructive"} className="text-sm">
                {screeningResult.pass ? <CheckCircle className="mr-1 h-4 w-4" /> : <XCircle className="mr-1 h-4 w-4" />}
                {screeningResult.pass ? "Pass" : "Fail"}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Reason:</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{screeningResult.reason}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Chat Transcript:</h4>
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {screeningResult.chatTranscript}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
