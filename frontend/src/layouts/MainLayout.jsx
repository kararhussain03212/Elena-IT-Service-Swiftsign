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
    <>
      <Navbar content={sections.navbar} />
      <main>
        <Outlet /> {/* This is where page content renders */}
      </main>
      <Footer content={sections.footer} />
      <FloatingButtons />
      <SocialIcon />
    </>
  );
};

export default MainLayout;
