import { BrowserRouter } from "react-router-dom";
import { Toaster } from "../shared/components/ui/toaster";
import { TooltipProvider } from "../shared/components/ui/tooltip";
import Index from "./pages/Index";
import "./App.css";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Index />
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
