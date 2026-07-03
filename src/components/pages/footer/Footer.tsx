import React from "react";
import { Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/hooks/useBranding";
import { useOrganizationContent } from "@/hooks/useOrganizationContent";

const contactLinkClass = cn(
  "flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors",
  "min-h-[44px] sm:min-h-0",
  "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
);

const Footer: React.FC = () => {
  const branding = useBranding();
  const { footerTagline } = useOrganizationContent();

  return (
    <footer
      aria-label="Paginavoettekst"
      className="bg-brand-600 py-4 sm:py-3 mt-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          <div>
            <h3 className="font-semibold text-white mb-0.5 text-xs">
              {branding.displayName}
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              {footerTagline}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2 sm:mb-1.5 text-xs">Contact</h3>
            <div className="space-y-3 sm:space-y-1.5">
              <div className="space-y-1">
                <p className="font-bold text-xs text-white">Nikki Noppe</p>
                <div className="space-y-0.5">
                  <a href="tel:+32468155216" className={contactLinkClass}>
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    <span>+32 468 15 52 16</span>
                  </a>
                  <a href="mailto:noppe.nikki@icloud.com" className={cn(contactLinkClass, "break-all")}>
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    <span>noppe.nikki@icloud.com</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-xs text-white">Wesley Dedeurwaerder</p>
                <a href="tel:+32472568049" className={contactLinkClass}>
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>+32 472 56 80 49</span>
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-xs text-white">Hans Reynaert</p>
                <a href="tel:+32470902027" className={contactLinkClass}>
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>+32 470 90 20 27</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-3 pt-3 sm:pt-2 border-t border-white/20 text-center">
          <p className="text-xs text-white/80 leading-relaxed">
            © {new Date().getFullYear()} {branding.displayName}. Alle rechten voorbehouden.{" "}
            <span className="opacity-60">v1.260703</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
