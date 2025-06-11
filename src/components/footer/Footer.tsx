import React from "react";
const Footer: React.FC = () => {
  return <footer className="bg-purple-300 py-4 sm:py-6 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <h3 className="font-semibold text-purple-dark mb-2 sm:mb-3 text-sm sm:text-base">
              Harelbeekse Minivoetbal Competitie
            </h3>
            <p className="text-xs text-white sm:text-sm">Minivoetbalcompetitie in sinds 1979.</p>
          </div>
          <div>
            <h3 className="font-semibold text-purple-dark mb-2 sm:mb-3 text-sm sm:text-base">Contact</h3>
            <div className="space-y-1">
              <p className="text-xs break-all text-white sm:text-sm">noppe.nikki@icloud.com</p>
              <p className="text-xs text-white sm:text-sm">+34 468 15 52 16</p>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-purple-light text-center">
          <p className="text-xs sm:text-[[soccer-light-green]] text-white">
            © {new Date().getFullYear()} Harelbeekse Minivoetbal Competitie. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;