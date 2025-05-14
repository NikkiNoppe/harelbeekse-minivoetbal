
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary py-6 text-foreground/80">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Harelbeekse Minivoetbal Competitie</h3>
            <p className="text-sm">Minivoetbalcompetitie in sinds 1985.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Contact</h3>
            <p className="text-sm">info@minivoetbalharelbeke.be</p>
            <p className="text-sm">+34 468 15 52 16</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Volg Ons</h3>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="hover:text-orange-400 transition-colors">Facebook</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Instagram</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Twitter</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-foreground/10 text-center text-sm">
          <p>© {new Date().getFullYear()} Voetbal Arena. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
