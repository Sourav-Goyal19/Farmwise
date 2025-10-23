import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      <Card className="max-w-4xl mx-auto text-center relative shadow-2xl border-border">
        <CardHeader className="space-y-6 pb-8">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              Join Us Today
            </Badge>
            <CardTitle className="text-4xl lg:text-5xl font-bold mb-4">
              Ready to Transform
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Farming Journey?
              </span>
            </CardTitle>
          </div>
          <CardDescription className="text-xl max-w-2xl mx-auto">
            Join thousands of Indian farmers already using Farmwise to grow
            smarter
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Link href="/sign-in">
            <Button size="lg" className="text-lg group shadow-xl">
              Start Free Today
              <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};
