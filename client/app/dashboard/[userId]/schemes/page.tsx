"use client";

import { useUser } from "@clerk/nextjs";
import {
  useFetchMatchingSchemesByFarmer,
  useCreateMatchedSchemes,
} from "@/hooks/matching-schemes-api-hook";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const SchemesPage = () => {
  const { user } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: matchingSchemes,
    isLoading,
    error,
    refetch,
  } = useFetchMatchingSchemesByFarmer(user?.id);

  const createMatchedSchemesMutation = useCreateMatchedSchemes();

  const handleRefreshSchemes = async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    try {
      await createMatchedSchemesMutation.mutateAsync({ farmerId: user.id });
      setTimeout(() => {
        refetch();
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error("Error refreshing schemes:", error);
      setIsRefreshing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getMinistryColor = (ministry: string) => {
    const ministryColors: Record<string, string> = {
      Agriculture: "bg-green-100 text-green-800 border-green-200",
      "Farmers Welfare": "bg-blue-100 text-blue-800 border-blue-200",
      "Rural Development": "bg-orange-100 text-orange-800 border-orange-200",
      "Water Resources": "bg-cyan-100 text-cyan-800 border-cyan-200",
      Environment: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Finance: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return (
      ministryColors[ministry] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  if (isLoading) {
    return (
      <div className="flex bg-background">
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <Spinner className="h-8 w-8" />
                <p className="text-muted-foreground">Loading your schemes...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-background">
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load schemes. Please try again.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Government Schemes
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover schemes tailored specifically for your farming profile
              </p>
            </div>

            <Button
              onClick={handleRefreshSchemes}
              disabled={isRefreshing || createMatchedSchemesMutation.isPending}
              className="flex items-center gap-2"
            >
              {isRefreshing || createMatchedSchemesMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Finding New Schemes...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Schemes
                </>
              )}
            </Button>
          </div>

          {createMatchedSchemesMutation.isSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully found new matching schemes for you!
              </AlertDescription>
            </Alert>
          )}

          {matchingSchemes && matchingSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingSchemes.map((scheme) => (
                <Card
                  key={scheme.id}
                  className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="secondary"
                        className={getMinistryColor(scheme.scheme.ministry)}
                      >
                        {scheme.scheme.ministry}
                      </Badge>
                      {scheme.scheme.state && (
                        <Badge variant="outline" className="text-xs">
                          {scheme.scheme.state}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl line-clamp-2 leading-tight">
                      {scheme.scheme.schemeName}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {scheme.scheme.objective}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Benefits</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {scheme.scheme.benefit}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Why it matches you
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {scheme.reason}
                        </p>
                      </div>

                      {scheme.scheme.deadline && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Deadline: {formatDate(scheme.scheme.deadline)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button asChild className="w-full" size="sm">
                      <Link
                        href={`/dashboard/${user?.id}/schemes/${scheme.schemeId}`}
                      >
                        View Details
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No schemes found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any government schemes that match your profile.
                Click the button below to analyze your profile and find suitable
                schemes.
              </p>
              <Button
                onClick={handleRefreshSchemes}
                disabled={
                  isRefreshing || createMatchedSchemesMutation.isPending
                }
                className="flex items-center gap-2 mx-auto"
              >
                {isRefreshing || createMatchedSchemesMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing Your Profile...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Find Matching Schemes
                  </>
                )}
              </Button>
            </div>
          )}

          {(isRefreshing || createMatchedSchemesMutation.isPending) &&
            matchingSchemes &&
            matchingSchemes.length > 0 && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card p-6 rounded-lg shadow-lg border flex flex-col items-center gap-4">
                  <Spinner className="h-8 w-8" />
                  <p className="text-sm text-muted-foreground">
                    Finding new matching schemes...
                  </p>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default SchemesPage;
