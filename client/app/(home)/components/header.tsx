import { Sprout, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Farmwise
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Contact
            </a>
            <Link href="/sign-in">
              <Button size="lg" className="shadow-md">
                Get Started
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <a
              href="#features"
              className="block py-2 text-foreground/80 hover:text-primary"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block py-2 text-foreground/80 hover:text-primary"
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="block py-2 text-foreground/80 hover:text-primary"
            >
              Contact
            </a>
            <Button className="w-full" size="lg">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
