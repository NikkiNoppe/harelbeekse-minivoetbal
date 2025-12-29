import React from "react";
import { Phone, Mail } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-purple-300 py-4 sm:py-3 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          {/* Organization Info */}
          <div>
            <h3 className="font-semibold text-purple-dark mb-0.5 text-xs">Harelbeekse Minivoetbal Competitie</h3>
            <p className="text-xs text-white/90">Minivoetbalcompetitie sinds 1979.</p>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-purple-dark mb-2 sm:mb-1.5 text-xs">Contact</h3>
            <div className="space-y-3 sm:space-y-1.5">
              {/* Nikki Noppe */}
              <div className="space-y-1">
                <p className="font-bold text-xs" style={{ color: 'var(--color-600)' }}>Nikki Noppe</p>
                <div className="space-y-0.5">
                  <a 
                    href="tel:+32468155216" 
                    className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors min-h-[44px] sm:min-h-0"
                  >
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>+32 468 15 52 16</span>
                  </a>
                  <a 
                    href="mailto:noppe.nikki@icloud.com" 
                    className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors break-all min-h-[44px] sm:min-h-0"
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>noppe.nikki@icloud.com</span>
                  </a>
                </div>
              </div>
              
              {/* Wesley Dedeurwaerder */}
              <div className="space-y-1">
                <p className="font-bold text-xs" style={{ color: 'var(--color-600)' }}>Wesley Dedeurwaerder</p>
                <a 
                  href="tel:+32472568049" 
                  className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors min-h-[44px] sm:min-h-0"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>+32 472 56 80 49</span>
                </a>
              </div>
              
              {/* Hans Reynaert */}
              <div className="space-y-1">
                <p className="font-bold text-xs" style={{ color: 'var(--color-600)' }}>Hans Reynaert</p>
                <a 
                  href="tel:+32470902027" 
                  className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors min-h-[44px] sm:min-h-0"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>+32 470 90 20 27</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-4 sm:mt-3 pt-3 sm:pt-2 border-t border-purple-light text-center">
          <p className="text-xs sm:text-[10px] text-white/80">
            © {new Date().getFullYear()} Harelbeekse Minivoetbal Competitie. Alle rechten voorbehouden.{" "}
            <span className="opacity-60">v1.251223</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
