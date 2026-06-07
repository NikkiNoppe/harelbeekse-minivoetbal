import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";
import HamburgerIcon from "@/components/ui/hamburger-icon";
import Logo from "./Logo";
import { useTabVisibility } from "@/context/TabVisibilityContext";
import { ADMIN_ROUTES, getPathFromTab } from "@/config/routes";
import {
  type NavItem,
  NAV_ROUTE_MAP,
  normalizeRole,
  getRoleLabel,
  getOrderedPublicNavItems,
  HEADER_WEDSTRIJDFORMULIEREN_ITEMS,
  HEADER_BEHEER_ITEMS,
  FINANCIEEL_ITEMS,
  HEADER_SYSTEEM_ITEMS,
  filterWedstrijdformulierenItems,
  filterBeheerItems,
  filterAdminOnlyItems,
  filterSpeelformatenItems,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  activeTab: string;
  isAuthenticated: boolean;
  user: { username?: string; email?: string; role?: string } | null;
  hasSidebar?: boolean;
}

const menuContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

const accordionTriggerClass =
  "text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 py-2 min-h-[44px] items-center hover:no-underline";

interface NavLinkButtonProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: (key: string) => void;
  variant?: "sheet" | "desktop";
  index?: number;
  animate?: boolean;
}

const NavLinkButton: React.FC<NavLinkButtonProps> = ({
  item,
  isActive,
  onNavigate,
  variant = "sheet",
  index = 0,
  animate = true,
}) => {
  const Icon = item.icon;
  const prefersReducedMotion = useReducedMotion();

  const button = (
    <button
      type="button"
      onClick={() => onNavigate(item.key)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        variant === "sheet" &&
          "btn-nav w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        variant === "sheet" && isActive && "active",
        variant === "desktop" &&
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white/90 hover:text-white hover:bg-purple-500/50 transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600",
        variant === "desktop" && isActive && "bg-purple-500/60 text-white font-medium"
      )}
    >
      <Icon size={18} className="flex-shrink-0" />
      {item.label}
    </button>
  );

  if (variant === "desktop") {
    return button;
  }

  if (!animate || prefersReducedMotion) {
    return <div key={`${item.key}-${item.label}-${index}`}>{button}</div>;
  }

  return (
    <motion.div key={`${item.key}-${item.label}-${index}`} variants={menuItemVariants}>
      {button}
    </motion.div>
  );
};

const Header: React.FC<HeaderProps> = ({
  onLogoClick,
  onLoginClick,
  activeTab,
  isAuthenticated,
  user,
  hasSidebar = false,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isTabVisible } = useTabVisibility();
  const prefersReducedMotion = useReducedMotion();

  const handleLogoClick = useCallback(() => {
    try {
      onLogoClick();
    } catch (_) {
      /* noop */
    }
  }, [onLogoClick]);

  const normalizedRole = normalizeRole(user?.role || "");
  const isAdmin = normalizedRole === "admin";
  const roleLabel = getRoleLabel(normalizedRole, isAdmin);

  const visiblePublicItems = getOrderedPublicNavItems(isTabVisible);

  const filterOpts = {
    isTabVisible,
    isAdmin,
    normalizedRole,
    userRole: user?.role,
    variant: "header" as const,
  };

  const visibleWedstrijdformulierenItems = isAuthenticated
    ? filterWedstrijdformulierenItems(HEADER_WEDSTRIJDFORMULIEREN_ITEMS, filterOpts)
    : [];
  const visibleBeheerItems = isAuthenticated
    ? filterBeheerItems(HEADER_BEHEER_ITEMS, filterOpts)
    : [];
  const visibleFinancieelItems = isAuthenticated
    ? filterAdminOnlyItems(FINANCIEEL_ITEMS, filterOpts)
    : [];
  const visibleSpeelformatenItems = filterSpeelformatenItems(isAdmin);
  const visibleSysteemItems = isAuthenticated
    ? filterAdminOnlyItems(HEADER_SYSTEEM_ITEMS, filterOpts)
    : [];

  const navigateToTab = (key: string) => {
    setIsSheetOpen(false);
    const path = NAV_ROUTE_MAP[key] || getPathFromTab(key);
    navigate(path);
  };

  const handleLogout = () => {
    setIsSheetOpen(false);
    logout();
  };

  const renderNavGroup = (title: string, items: NavItem[], animate = true) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
        {title}
      </h3>
      <motion.div
        className="space-y-2"
        variants={animate && !prefersReducedMotion ? menuContainerVariants : undefined}
        initial={animate && !prefersReducedMotion ? "hidden" : false}
        animate={animate && !prefersReducedMotion ? "show" : false}
      >
        {items.map((item, index) => (
          <NavLinkButton
            key={`${item.key}-${item.label}-${index}`}
            item={item}
            isActive={activeTab === item.key}
            onNavigate={navigateToTab}
            index={index}
            animate={animate}
          />
        ))}
      </motion.div>
    </div>
  );

  return (
    <header className="bg-purple-600 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-purple-900 focus:shadow-lg focus:outline-none"
      >
        Naar hoofdinhoud
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
            {isAuthenticated && hasSidebar && (
              <SidebarTrigger className="p-2 rounded-md transition-all sidebar-trigger" />
            )}
            <div className="hidden lg:block shrink-0">
              <Logo onClick={handleLogoClick} />
            </div>
            {visiblePublicItems.length > 0 && (
              <nav
                className="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto"
                aria-label="Hoofdnavigatie"
              >
                {visiblePublicItems.map((item) => (
                  <NavLinkButton
                    key={item.key}
                    item={item}
                    isActive={activeTab === item.key}
                    onNavigate={navigateToTab}
                    variant="desktop"
                    animate={false}
                  />
                ))}
              </nav>
            )}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 lg:hidden">
            <Logo onClick={handleLogoClick} />
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-white bg-purple-200 hover:bg-purple-300 transition-all duration-200 motion-safe:hover:scale-105"
                aria-label="Open navigatiemenu"
              >
                <HamburgerIcon className="transition-transform duration-200 text-purple-900" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="navigation-modal w-full max-w-sm border-l border-purple-200 shadow-2xl flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden !gap-0 p-0"
              style={{ backgroundColor: "var(--color-100)" }}
            >
              <SheetHeader className="border-b border-gray-200 px-6 pt-6 pb-4 flex-shrink-0 pr-16 sm:pr-14">
                <SheetTitle className={isAuthenticated ? "sr-only" : "text-2xl font-bold text-purple-800 text-left"}>
                  Navigatie
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigeer door de verschillende secties van de website
                </SheetDescription>

                {isAuthenticated && (
                  <button
                    type="button"
                    className="w-full p-4 bg-purple-200 rounded-xl shadow-sm border border-purple-200 text-left hover:bg-purple-300/80 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    onClick={() => {
                      setIsSheetOpen(false);
                      navigate(ADMIN_ROUTES.profile);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center shadow-md">
                        <User size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 text-sm">
                          {user?.username || user?.email}
                        </p>
                        <span className="text-xs text-purple-900 bg-white/80 px-2 py-1 rounded-full inline-block mt-1">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </SheetHeader>

              <nav
                aria-label="Mobiel menu"
                className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain scrollbar-hide px-6 py-4 space-y-6"
              >
                <div className="lg:hidden">
                  {renderNavGroup("Informatie", visiblePublicItems)}
                </div>

                {isAuthenticated && (
                  <Accordion type="multiple" defaultValue={["wedstrijdformulieren", "beheer"]} className="space-y-2">
                    {visibleWedstrijdformulierenItems.length > 0 && (
                      <AccordionItem value="wedstrijdformulieren" className="border-none">
                        <AccordionTrigger className={accordionTriggerClass}>
                          Formulieren
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          <motion.div
                            variants={prefersReducedMotion ? undefined : menuContainerVariants}
                            initial={prefersReducedMotion ? false : "hidden"}
                            animate={prefersReducedMotion ? false : "show"}
                            className="space-y-2"
                          >
                            {visibleWedstrijdformulierenItems.map((item, index) => (
                              <NavLinkButton
                                key={item.key}
                                item={item}
                                isActive={activeTab === item.key}
                                onNavigate={navigateToTab}
                                index={index}
                              />
                            ))}
                          </motion.div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {visibleBeheerItems.length > 0 && (
                      <AccordionItem value="beheer" className="border-none">
                        <AccordionTrigger className={accordionTriggerClass}>
                          Beheer
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          <motion.div
                            variants={prefersReducedMotion ? undefined : menuContainerVariants}
                            initial={prefersReducedMotion ? false : "hidden"}
                            animate={prefersReducedMotion ? false : "show"}
                            className="space-y-2"
                          >
                            {visibleBeheerItems.map((item, index) => (
                              <NavLinkButton
                                key={`${item.key}-${item.label}-${index}`}
                                item={item}
                                isActive={activeTab === item.key}
                                onNavigate={navigateToTab}
                                index={index}
                              />
                            ))}
                          </motion.div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {visibleFinancieelItems.length > 0 && (
                      <AccordionItem value="financieel" className="border-none">
                        <AccordionTrigger className={accordionTriggerClass}>
                          Financieel
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          <motion.div
                            variants={prefersReducedMotion ? undefined : menuContainerVariants}
                            initial={prefersReducedMotion ? false : "hidden"}
                            animate={prefersReducedMotion ? false : "show"}
                            className="space-y-2"
                          >
                            {visibleFinancieelItems.map((item, index) => (
                              <NavLinkButton
                                key={item.key}
                                item={item}
                                isActive={activeTab === item.key}
                                onNavigate={navigateToTab}
                                index={index}
                              />
                            ))}
                          </motion.div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {visibleSpeelformatenItems.length > 0 && (
                      <AccordionItem value="speelformaten" className="border-none">
                        <AccordionTrigger className={accordionTriggerClass}>
                          Speelformaten
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          <motion.div
                            variants={prefersReducedMotion ? undefined : menuContainerVariants}
                            initial={prefersReducedMotion ? false : "hidden"}
                            animate={prefersReducedMotion ? false : "show"}
                            className="space-y-2"
                          >
                            {visibleSpeelformatenItems.map((item, index) => (
                              <NavLinkButton
                                key={item.key}
                                item={item}
                                isActive={activeTab === item.key}
                                onNavigate={navigateToTab}
                                index={index}
                              />
                            ))}
                          </motion.div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {visibleSysteemItems.length > 0 && (
                      <AccordionItem value="instellingen" className="border-none">
                        <AccordionTrigger className={accordionTriggerClass}>
                          Instellingen
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          <motion.div
                            variants={prefersReducedMotion ? undefined : menuContainerVariants}
                            initial={prefersReducedMotion ? false : "hidden"}
                            animate={prefersReducedMotion ? false : "show"}
                            className="space-y-2"
                          >
                            {visibleSysteemItems.map((item, index) => (
                              <NavLinkButton
                                key={item.key}
                                item={item}
                                isActive={activeTab === item.key}
                                onNavigate={navigateToTab}
                                index={index}
                              />
                            ))}
                          </motion.div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </nav>

              <footer className="mt-auto flex-shrink-0 w-full border-t border-gray-200 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      onLoginClick();
                      setIsSheetOpen(false);
                    }}
                    className="btn-nav active w-full flex items-center justify-center gap-2"
                  >
                    <User size={18} className="flex-shrink-0" aria-hidden />
                    Inloggen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-nav w-full flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} className="flex-shrink-0" aria-hidden />
                    Uitloggen
                  </button>
                )}
              </footer>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
