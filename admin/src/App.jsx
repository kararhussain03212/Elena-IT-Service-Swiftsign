import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import PermissionDeniedPopup from "./components/PermissionDeniedPopup.jsx";

// Auth & Dashboard
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/users/UserManagement";

// Sliders
import SliderList from "./pages/sliders/SliderList";
import SliderForm from "./pages/sliders/SliderForm";

// Services
import ServiceList from "./pages/services/ServiceList";
import ServiceForm from "./pages/services/ServiceForm";
import SubServiceList from "./pages/subServices/SubServiceList";
import SubServiceForm from "./pages/subServices/SubServiceForm";

// Projects
import ProjectList from "./pages/projects/ProjectList";
import ProjectForm from "./pages/projects/ProjectForm";

// Team
import TeamList from "./pages/team/TeamList";
import TeamForm from "./pages/team/TeamForm";

// Testimonials
import TestimonialList from "./pages/testimonials/TestimonialList";
import TestimonialForm from "./pages/testimonials/TestimonialForm";

// Blogs
import BlogList from "./pages/blogs/BlogList";
import BlogForm from "./pages/blogs/BlogForm";
import ContactMessageList from "./pages/contactMessages/ContactMessageList";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SectionKeyPage from "./pages/sections/SectionKeyPage";
import { SECTION_PAGES } from "./pages/sections/sectionDefinitions";

// Certifications
import CertificationList from "./pages/certifications/CertificationList";
import CertificationForm from "./pages/certifications/CertificationForm";

// Career
import CareerPageSettings from "./pages/career/CareerPageSettings";
import CareerProgramList from "./pages/career/CareerProgramList";
import CareerProgramForm from "./pages/career/CareerProgramForm";
import ProgramApplicationList from "./pages/career/ProgramApplicationList";
import NewsletterSubscriberList from "./pages/career/NewsletterSubscriberList";

export default function App() {
  const routerBase = (() => {
    const configuredBase = import.meta.env.BASE_URL || "/";
    if (configuredBase !== "/") {
      return configuredBase;
    }
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      return "/admin/";
    }
    return "/";
  })();

  return (
    <AuthProvider>
      <BrowserRouter basename={routerBase}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sliders"
            element={
              <ProtectedRoute>
                <Layout>
                  <SliderList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sliders/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <SliderForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sliders/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SliderForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Layout>
                  <ServiceList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sub-services"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubServiceList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-services/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubServiceForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-services/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubServiceForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ServiceForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ServiceForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/testimonials"
            element={
              <ProtectedRoute>
                <Layout>
                  <TestimonialList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/testimonials/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <TestimonialForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/testimonials/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TestimonialForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/blogs"
            element={
              <ProtectedRoute>
                <Layout>
                  <BlogList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <BlogForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <BlogForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact-messages"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ContactMessageList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sections/certifications-list"
            element={
              <ProtectedRoute>
                <Layout>
                  <CertificationList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CertificationForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CertificationForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/career-page-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <CareerPageSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-programs"
            element={
              <ProtectedRoute>
                <Layout>
                  <CareerProgramList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-programs/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CareerProgramForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-programs/edit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CareerProgramForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/program-applications"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ProgramApplicationList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/newsletter-subscribers"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <NewsletterSubscriberList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sections"
            element={<Navigate to={SECTION_PAGES[0].path} replace />}
          />

          {SECTION_PAGES.map((sectionItem) => (
            <Route
              key={sectionItem.path}
              path={sectionItem.path}
              element={
                <ProtectedRoute>
                  <Layout>
                    <SectionKeyPage
                      sectionKey={sectionItem.key}
                      title={sectionItem.label}
                    />
                  </Layout>
                </ProtectedRoute>
              }
            />
          ))}

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/settings" replace />} />

          {/* 404 - catch all */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen text-2xl font-bold text-gray-400">
                404 — Page Not Found
              </div>
            }
          />
        </Routes>
        <PermissionDeniedPopup />
      </BrowserRouter>
    </AuthProvider>
  );
}
