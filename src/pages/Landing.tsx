import React, { useRef } from "react";
import { Navigation } from "@/components/landing/Navigation";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  // Referência para scroll das seções
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation scrollToFeatures={scrollToFeatures} />
      <Hero scrollToFeatures={scrollToFeatures} />
      <Features ref={featuresRef} />
      <PreviewSection />
      <SecuritySection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
