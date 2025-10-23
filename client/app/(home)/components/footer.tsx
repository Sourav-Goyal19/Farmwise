import { Separator } from "@radix-ui/react-separator";
import { Sprout } from "lucide-react";
import React from "react";

export const Footer = () => {
  return (
    <footer
      id="contact"
      className="bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 border-t border-border"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Farmwise</span>
            </div>
            <p className="text-muted-foreground">
              Empowering Indian farmers with intelligent technology and
              compassionate support.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-muted-foreground">
              <a
                href="#features"
                className="block hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block hover:text-primary transition-colors"
              >
                How It Works
              </a>
              <a
                href="#contact"
                className="block hover:text-primary transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2 text-muted-foreground">
              <a
                href="#"
                className="block hover:text-primary transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="block hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="block hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-center text-muted-foreground">
          <p>© 2025 Farmwise. Built with ❤️ for Indian farmers.</p>
        </div>
      </div>
    </footer>
  );
};
