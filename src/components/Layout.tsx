
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { useTabVisibility } from "@/context/TabVisibilityContext";

const Layout = () => {
  const { loading } = useTabVisibility();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLoginClick = () => {
    // For now, just log the action - this can be expanded later
    console.log('Login clicked');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Applicatie laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogoClick={handleLogoClick} onLoginClick={handleLoginClick} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
