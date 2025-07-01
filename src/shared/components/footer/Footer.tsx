import React from "react";
import { Card, CardContent } from "@shared/components/ui/card";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-purple-900 border-t-2 border-purple-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-white">
                <Mail className="w-4 h-4 text-purple-300" />
                <a href="mailto:info@harelbeekseminivoetbal.be" className="hover:text-purple-200 transition-colors">
                  info@harelbeekseminivoetbal.be
                </a>
              </div>
              <div className="flex items-center space-x-3 text-white">
                <Phone className="w-4 h-4 text-purple-300" />
                <a href="tel:+32468155216" className="hover:text-purple-200 transition-colors">
                  +32 468 15 52 16
                </a>
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Organisatie</h3>
            <div className="text-white">
              <p className="font-medium text-white">Harelbeekse Minivoetbal</p>
              <p className="text-sm">Sinds 1979</p>
              <p className="text-sm mt-2">
                Professionele minivoetbalcompetitie in Harelbeke
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white text-sm">
            © 2024 Harelbeekse Minivoetbal. Alle rechten voorbehouden.
          </div>
          <div className="text-white text-sm mt-4 md:mt-0">
            Seizoen 2024-2025
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
