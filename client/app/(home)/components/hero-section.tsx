import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Image,
  MessageSquare,
  Mic,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const HeroSection = () => {
  const inputMethods = [
    {
      icon: Mic,
      label: "Voice Input",
      desc: "Speak naturally in Malayalam",
    },
    { icon: FileText, label: "Text Input", desc: "Type your queries" },
    { icon: Image, label: "Image Input", desc: "Share photos of crops" },
  ];

  const benefits = [
    "Multimodal AI Assistant",
    "Multiple Language Support",
    "Real-time Market Data",
    "Government Scheme Access",
    "Automated Logging",
    "24/7 Support",
  ];
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              AI-Powered Farming Assistant
            </Badge>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your Trusted
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Farming Companion
              </span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Empowering Indian farmers with AI that speaks Malayalam,
              understands your needs, and helps you grow smarter. From voice
              logging to market insights - all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-in">
                <Button size="lg" className="text-lg group shadow-xl">
                  Start Your Journey
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg">
                Watch Demo
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:h-[600px] hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
            <Card className="relative shadow-2xl border-border">
              <CardContent className="p-8 space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-sm">AI Assistant</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background rounded-xl p-4 text-sm space-y-2">
                      <div className="font-medium">
                        "ഇന്ന് നെൽക്കൃഷിയിൽ കീടനാശിനി തളിച്ചു"
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Voice input detected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <CardTitle className="text-sm">Auto-logged</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background rounded-xl p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activity:</span>
                        <span className="font-semibold">Pesticide Applied</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crop:</span>
                        <span className="font-semibold">Rice</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-semibold">Today</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-500/5 border-green-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-sm">Market Alert</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background rounded-xl p-4 text-sm">
                      Rice prices expected to rise{" "}
                      <span className="font-bold text-green-500">12%</span> next
                      week. Best time to sell!
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-8 lg:hidden">
          {inputMethods.map((method, idx) => (
            <Card key={idx} className="flex-1 min-w-[150px]">
              <CardContent className="flex items-center gap-3 p-4">
                {/* @ts-ignore */}
                <method.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{method.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {method.desc}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
