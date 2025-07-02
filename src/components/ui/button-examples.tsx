import React from "react";
import { Button } from "@/components/ui/button";

// Example component showing all three button styles
export const ButtonExamples: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-purple-dark">Button Styling Voorbeelden</h2>
      
      {/* ButtonDark Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-dark">ButtonDark - "Inloggen" Style</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="btn-dark">
            Inloggen
          </Button>
          <Button className="btn-dark btn-sm">
            Kleine Button
          </Button>
          <Button className="btn-dark btn-lg">
            Grote Button
          </Button>
          <Button className="btn-dark btn-auto">
            Auto Width
          </Button>
          <Button className="btn-dark" disabled>
            Uitgeschakeld
          </Button>
        </div>
      </div>

      {/* ButtonLight Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-dark">ButtonLight - "Wachtwoord vergeten?" Style</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="btn-light">
            Wachtwoord vergeten?
          </Button>
          <Button className="btn-light btn-sm">
            Kleine Button
          </Button>
          <Button className="btn-light btn-lg">
            Grote Button
          </Button>
          <Button className="btn-light btn-auto">
            Auto Width
          </Button>
          <Button className="btn-light" disabled>
            Uitgeschakeld
          </Button>
        </div>
      </div>

      {/* ButtonWhite Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-dark">ButtonWhite - Dropdown Style</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="btn-white">
            Selecteer optie
          </Button>
          <Button className="btn-white btn-sm">
            Kleine Button
          </Button>
          <Button className="btn-white btn-lg">
            Grote Button
          </Button>
          <Button className="btn-white btn-auto">
            Auto Width
          </Button>
          <Button className="btn-white" disabled>
            Uitgeschakeld
          </Button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-semibold text-purple-dark mb-2">Gebruik:</h4>
        <div className="space-y-2 text-sm">
          <p><code className="bg-white px-2 py-1 rounded">className="btn-dark"</code> - Donkere button (Inloggen)</p>
          <p><code className="bg-white px-2 py-1 rounded">className="btn-light"</code> - Lichte button (Wachtwoord vergeten?)</p>
          <p><code className="bg-white px-2 py-1 rounded">className="btn-white"</code> - Witte button (Dropdown stijl)</p>
          <p><code className="bg-white px-2 py-1 rounded">className="btn-dark btn-sm"</code> - Kleine variant</p>
          <p><code className="bg-white px-2 py-1 rounded">className="btn-dark btn-auto"</code> - Auto width</p>
        </div>
      </div>
    </div>
  );
};

export default ButtonExamples; 