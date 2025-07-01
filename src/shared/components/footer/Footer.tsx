import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full bg-gradient-to-r from-purple-600 to-purple-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Harelbeekse Minivoetbal Competitie
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed">
                Minivoetbalcompetitie sinds 1979. Een traditie van sport, vriendschap en competitie in Harelbeke.
              </p>
              <div className="flex items-center space-x-2 text-purple-100">
                <MapPin size={16} />
                <span className="text-sm">Harelbeke, België</span>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-purple-100">
                  <Mail size={16} className="flex-shrink-0" />
                  <a 
                    href="mailto:noppe.nikki@icloud.com" 
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    noppe.nikki@icloud.com
                  </a>
                </div>
                <div className="flex items-center space-x-3 text-purple-100">
                  <Phone size={16} className="flex-shrink-0" />
                  <a 
                    href="tel:+32468155216" 
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    +32 468 15 52 16
                  </a>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block text-sm text-purple-100 hover:text-white transition-colors duration-200"
                >
                  Competitie Schema
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-purple-100 hover:text-white transition-colors duration-200"
                >
                  Reglement
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-purple-100 hover:text-white transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-purple-500 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-purple-100 text-center sm:text-left">
              © {currentYear} Harelbeekse Minivoetbal Competitie. Alle rechten voorbehouden.
            </p>
            <div className="flex items-center space-x-6">
              <a 
                href="#" 
                className="text-sm text-purple-100 hover:text-white transition-colors duration-200"
              >
                Privacy
              </a>
              <a 
                href="#" 
                className="text-sm text-purple-100 hover:text-white transition-colors duration-200"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;