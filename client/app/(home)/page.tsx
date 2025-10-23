"use client";

import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { CTASection } from "./components/cta-section";
import { HeroSection } from "./components/hero-section";
import { FeaturesSection } from "./components/features-section";
import { HowItWorksSection } from "./components/how-works-section";

export default function FarmwiseLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
