"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateJobDescriptionAction } from "@/lib/actions/ai-actions";
import type { GenerateJobDescriptionInput, GenerateJobDescriptionOutput } from "@/ai/flows/generate-job-description";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  roleBrief: z.string().min(50, "Role brief must be at least 50 characters."),
  language: z.enum(["en", "bn"], { required_error: "Please select a language." }),
});

type FormData = z.infer<typeof formSchema>;

export function JobDescriptionGeneratorForm() {
  const [generatedJD, setGeneratedJD] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: "en",
    },
  });

  const selectedLanguage = watch("language");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setGeneratedJD(null);
    const result = await generateJobDescriptionAction(data as GenerateJobDescriptionInput);
    setIsLoading(false);

    if ("error" in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setGeneratedJD((result as GenerateJobDescriptionOutput).jobDescription);
      toast({
        title: "Success",
        description: "Job description generated successfully.",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-primary">Generate Job Description</CardTitle>
          <CardDescription>Provide details about the role, and our AI will craft a compelling job description.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="roleBrief" className="font-semibold">Role Brief</Label>
              <Textarea
                id="roleBrief"
                {...register("roleBrief")}
                placeholder="Describe the role, including key responsibilities, required skills (e.g., React, Node.js, Python), years of experience, and company culture highlights."
                className="mt-1 min-h-[150px]"
                aria-invalid={errors.roleBrief ? "true" : "false"}
              />
              {errors.roleBrief && <p className="text-sm text-destructive mt-1">{errors.roleBrief.message}</p>}
            </div>

            <div>
              <Label className="font-semibold">Language</Label>
              <RadioGroup
                defaultValue="en"
                onValueChange={(value: "en" | "bn") => setValue("language", value)}
                className="mt-2 flex gap-4"
                aria-invalid={errors.language ? "true" : "false"}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" checked={selectedLanguage === "en"} />
                  <Label htmlFor="lang-en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bn" id="lang-bn" checked={selectedLanguage === "bn"} />
                  <Label htmlFor="lang-bn">Bangla (বাংলা)</Label>
                </div>
              </RadioGroup>
              {errors.language && <p className="text-sm text-destructive mt-1">{errors.language.message}</p>}
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate JD
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating job description...</p>
          </div>
        </Card>
      )}

      {generatedJD && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-primary">Generated Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
              {generatedJD}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigator.clipboard.writeText(generatedJD);
                toast({ title: "Copied!", description: "Job description copied to clipboard." });
              }}
            >
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
