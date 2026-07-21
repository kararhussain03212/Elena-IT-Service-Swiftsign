// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Pages
import Home from "./pages/Home/Home";
import About from "./pages/AboutUs/AboutUs";
import Services from "./pages/Services";
import ServiceContent from "./pages/ServiceContent";
import Blog from "./pages/Blogs";
import BlogDetails from "./pages/BlogDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound/NotFound";
import OurTeam from "./pages/OurTeam";
import TeamDetails from "./pages/TeamDetails";
import Certification from "./pages/Certification";
import CertificationDetail from "./pages/CertificationDetail";
import Career from "./pages/Career";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";



function App() {
  const routerBase = import.meta.env.BASE_URL || "/";

  return (
    <BrowserRouter basename={routerBase}>
      <Routes>
        {/* Wrap all public pages with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceContent />} />
          <Route path="/ServiceContent/:id" element={<ServiceContent />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetails />} />
          <Route path="/ourteam" element={<OurTeam />} />
          <Route path="/certification" element={<Certification />} />
          <Route path="/certification/:id" element={<CertificationDetail />} />
          <Route path="/career" element={<Career />} />
          <Route path="/team/:slug" element={<TeamDetails />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Catch all - 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
