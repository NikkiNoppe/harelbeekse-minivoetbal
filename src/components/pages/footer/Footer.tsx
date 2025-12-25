import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-purple-300 py-4 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h3 className="font-semibold text-purple-dark mb-0.5 text-sm">Harelbeekse Minivoetbal Competitie</h3>
            <p className="text-xs text-white">Minivoetbalcompetitie sinds 1979.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-purple-dark mb-1.5 text-sm">Contact</h3>
            <div className="space-y-2 text-xs text-white">
              <div>
                <p className="font-bold" style={{ color: 'var(--color-600)' }}>Nikki Noppe</p>
                <p>+32 468 15 52 16</p>
                <p className="break-all">noppe.nikki@icloud.com</p>
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--color-600)' }}>Wesley Dedeurwaerder</p>
                <p>+32 472 56 80 49</p>
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--color-600)' }}>Hans Reynaert</p>
                <p>+32 470 90 20 27</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-purple-light text-center">
          <p className="text-xs text-white">
            © {new Date().getFullYear()} Harelbeekse Minivoetbal Competitie. Alle rechten voorbehouden.{" "}
            <span className="opacity-60">v1.251223</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
