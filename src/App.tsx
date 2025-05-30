
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <TabVisibilityProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </TabVisibilityProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
