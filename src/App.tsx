
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/components/pages/login/AuthProvider";
import { ModalProvider } from "@/context/ModalContext";
import { TabVisibilityProvider } from "@/context/TabVisibilityContext";
import { PlayerListLockProvider } from "@/context/PlayerListLockContext";
import { ThemeProvider } from "./hooks/use-theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PUBLIC_ROUTES, ADMIN_ROUTES } from "./config/routes";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ScrollRestore } from "@/components/common/ScrollRestore";

// Lazy load main components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <ModalProvider>
          <PlayerListLockProvider>
            <TabVisibilityProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollRestore />
                  <Routes>
                    {/* Redirect root to algemeen */}
                    <Route path="/" element={<Navigate to={PUBLIC_ROUTES.algemeen} replace />} />
                    
                    {/* Public routes - Lazy loaded with Suspense */}
                    <Route path={PUBLIC_ROUTES.algemeen} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    <Route path={PUBLIC_ROUTES.competitie} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    <Route path={PUBLIC_ROUTES.beker} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    <Route path={PUBLIC_ROUTES.playoff} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    <Route path={PUBLIC_ROUTES.reglement} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    <Route path={PUBLIC_ROUTES.kaarten} element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Index />
                      </Suspense>
                    } />
                    
                    {/* Admin routes - Protected with authentication - Lazy loaded with Suspense */}
                    <Route path={ADMIN_ROUTES['match-forms']} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES['match-forms-league']} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES['match-forms-cup']} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES['match-forms-playoffs']} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.players} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.teams} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.users} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.competition} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.playoffs} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.cup} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.financial} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.settings} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.suspensions} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.schorsingen} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES.scheidsrechters} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES['blog-management']} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path={ADMIN_ROUTES['notification-management']} element={
                      <ProtectedRoute requireAdmin>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* User Profile Route - Protected */}
                    <Route path={ADMIN_ROUTES.profile} element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Index />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Other routes - Lazy loaded with Suspense */}
                    <Route path="/reset-password" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ResetPassword />
                      </Suspense>
                    } />
                    
                    {/* Catch-all for unknown routes - Lazy loaded with Suspense */}
                    <Route path="*" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <NotFound />
                      </Suspense>
                    } />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </TabVisibilityProvider>
          </PlayerListLockProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
