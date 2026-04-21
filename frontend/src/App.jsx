// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
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


function App() {
  return (
    <BrowserRouter>
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
          <Route path="/team/:slug" element={<TeamDetails />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Catch all - 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
