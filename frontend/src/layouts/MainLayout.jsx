// src/layouts/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SocialIcon from "@/components/SocialIcon";
import { useSections } from "@/hooks/useSections";

const MainLayout = () => {
  const { pathname } = useLocation();
  const { sections } = useSections("global");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-white">
      {/* Scrollable Main Content overlay */}
      <div className="relative z-10 bg-white min-h-screen shadow-2xl">
        <Navbar content={sections.navbar} />
        <main className="w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Sticky Footer on desktop, standard flow on mobile */}
      <div className="relative lg:sticky lg:bottom-0 z-0 min-h-fit lg:min-h-screen w-full flex flex-col justify-end">
        <Footer content={sections.footer} />
      </div>

      <FloatingButtons />
    </div>
  );
};

export default MainLayout;

