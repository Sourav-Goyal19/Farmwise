"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFetchMatchingSchemeById } from "@/hooks/matching-schemes-api-hook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

const SchemeDetailPage = () => {
  const { user } = useUser();
  const params = useParams();
  const schemeId = params.schemeId as string;

  const {
    data: matchingScheme,
    isLoading,
    error,
  } = useFetchMatchingSchemeById(schemeId);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex bg-background">
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <Spinner className="h-8 w-8" />
                <p className="text-muted-foreground">
                  Loading scheme details...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !matchingScheme) {
    return (
      <div className="flex bg-background">
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load scheme details. Please try again.
              </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/${user?.id}/schemes`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Schemes
              </Link>
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Button asChild variant="ghost" className="mb-6 -ml-2">
            <Link href={`/dashboard/${user?.id}/schemes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schemes
            </Link>
          </Button>

          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm">
                    {matchingScheme.scheme.ministry}
                  </Badge>
                  {matchingScheme.scheme.state && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {matchingScheme.scheme.state}
                    </Badge>
                  )}
                  {matchingScheme.scheme.deadline && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-amber-50 text-amber-700"
                    >
                      <Calendar className="h-3 w-3" />
                      Apply by: {formatDate(matchingScheme.scheme.deadline)}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {matchingScheme.scheme.schemeName}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {matchingScheme.scheme.objective}
                </p>
              </div>

              <Button asChild className="flex items-center gap-2">
                <a
                  href={matchingScheme.scheme.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Benefits Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Key Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {matchingScheme.scheme.benefit}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why This Scheme Matches You</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {matchingScheme.reason}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {matchingScheme.scheme.applicationProcess}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(matchingScheme.scheme.eligibilityCriteria) ? (
                    <ul className="space-y-2">
                      {matchingScheme.scheme.eligibilityCriteria.map(
                        (criteria: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {criteria}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {String(matchingScheme.scheme.eligibilityCriteria)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(matchingScheme.scheme.documentsRequired) ? (
                    <ul className="space-y-2">
                      {matchingScheme.scheme.documentsRequired.map(
                        (doc: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {doc}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {String(matchingScheme.scheme.documentsRequired)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Scheme Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>
                      {formatDate(matchingScheme.scheme.lastUpdatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matched On:</span>
                    <span>{formatDate(matchingScheme.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SchemeDetailPage;
