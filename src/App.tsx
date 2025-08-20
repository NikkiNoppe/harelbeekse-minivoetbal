
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/pages/login/AuthProvider";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import { ThemeProvider } from "./hooks/use-theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TabVisibilityProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TabVisibilityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
