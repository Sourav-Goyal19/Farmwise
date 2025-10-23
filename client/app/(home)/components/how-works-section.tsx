import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Badge,
  MessageSquare,
  Sprout,
  TrendingUp,
} from "lucide-react";

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge className="text-primary border-primary/20">
            Simple Process
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Simple, Smart,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Effective
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting started with Farmwise is as easy as having a conversation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: "Share Your Details",
              desc: "Talk, type, or send photos in Malayalam. Our AI understands everything about your farm.",
              icon: MessageSquare,
            },
            {
              step: "02",
              title: "Get Personalized Insights",
              desc: "Receive tailored advice, market updates, and scheme recommendations based on your profile.",
              icon: TrendingUp,
            },
            {
              step: "03",
              title: "Grow Your Success",
              desc: "Track progress, optimize operations, and increase profits with intelligent farming.",
              icon: Sprout,
            },
          ].map((item, idx) => (
            <div key={idx} className="relative">
              {idx < 2 && (
                <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -z-10">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
                </div>
              )}
              <Card className="shadow-lg border-border h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-6xl font-bold text-primary/20">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {item.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
