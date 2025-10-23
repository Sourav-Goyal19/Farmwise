import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Badge,
  BadgeIndianRupee,
  BookOpen,
  MessageSquare,
  Sprout,
  TrendingUp,
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Sprout,
      title: "Dynamic Profile Building",
      description:
        "Create your complete farming profile through simple voice, text, or image inputs in Malayalam. Our AI understands your needs and builds a living profile that grows with you.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description:
        "Talk to Farmwise like a trusted friend. Our empathetic AI understands Malayalam dialects, detects emotions, and provides personalized advice in your language.",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: BookOpen,
      title: "Voice-to-Log Automation",
      description:
        "Simply speak your daily activities and watch them transform into detailed digital logs. No typing needed - just talk naturally about your farming work.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      description:
        "Get real-time price predictions, identify best buyers, and know exactly when to sell. Make informed decisions with AI-powered market insights.",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: BadgeIndianRupee,
      title: "Government Schemes",
      description:
        "Automatically discover schemes you're eligible for. Get guided support for applications, document preparation, and deadline tracking - all in Malayalam.",
      color: "from-green-500 to-emerald-600",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge className="text-primary border-primary/20">
            Platform Features
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Modern Farmers
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your farm efficiently, make better
            decisions, and maximize your profits
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group border-border"
            >
              <CardHeader>
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
