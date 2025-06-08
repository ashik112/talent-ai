import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature } from "lucide-react";

export default function OfferLettersPage() {
  return (
    <>
      <PageHeader
        title="Offer Letter Generation"
        description="Generate customizable offer letters with e-sign integration."
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="items-center text-center">
          <FileSignature className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="font-headline text-2xl text-primary">Coming Soon!</CardTitle>
          <CardDescription>
            Our Offer-Letter Generator Agent will streamline your hiring process
            by creating and managing offer letters with e-signature capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Get ready to send professional, customizable offer letters in minutes.
            Integration with e-signature platforms like PandaDoc/DocuSign is planned.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
