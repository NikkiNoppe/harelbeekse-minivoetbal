
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PUBLIC_ROUTES } from "@/config/routes";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(PUBLIC_ROUTES.algemeen);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-brand-900">404</h1>
        <p className="text-xl text-brand-700 mb-4">Pagina niet gevonden</p>
        <p className="text-sm text-brand-600 mb-6">De pagina die je zoekt bestaat niet.</p>
        <a 
          href={PUBLIC_ROUTES.algemeen}
          className="text-brand-600 hover:text-brand-800 underline font-semibold"
          onClick={handleGoHome}
        >
          Ga terug naar Algemeen
        </a>
      </div>
    </div>
  );
};

export default NotFound;
