
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";
// import { MantineProvider } from "@/providers/MantineProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./hooks/use-theme";
import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <TabVisibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TabVisibilityProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
