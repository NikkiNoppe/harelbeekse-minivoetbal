import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const AlgemeenTab: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-slide-up">
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Over de Competitie</h2>
        <Card>
          <CardContent className="pt-4 sm:pt-6 text-sm sm:text-base">
            <p className="mb-3 sm:mb-4">
              De Harelbeekse Minivoetbal Competitie is opgericht in 1979 en is uitgegroeid tot een vaste waarde in de regio.
            </p>
            <p className="mb-3 sm:mb-4">
              Onze competitie staat bekend om zijn sportiviteit.
            </p>
            <p className="break-words">
              Interesse om deel te nemen met een team? Neem dan contact op via noppe.nikki@icloud.com.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-1">Contact</h2>
        <Card>
          <CardContent className="pt-4 sm:pt-6 bg-transparent">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Competitieleiding</h3>
                <div className="space-y-1 text-sm sm:text-base">
                  <p>Nikki Noppe</p>
                  <p className="break-all">info@minivoetbalharelbeke.be</p>
                  <p>+32 468 15 52 16</p>
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Locatie</h3>
                <div className="space-y-1 text-sm sm:text-base">
                  <p>Sporthal De Dageraad</p>
                  <p>Stasegemsesteenweg 21</p>
                  <p>8530 Harelbeke</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AlgemeenTab;