import API from "./axios";

const fresh = () => ({ params: { t: Date.now() } });

// Team API
export const getTeamMembers = () => API.get("/team");
export const getTeamMemberBySlug = (slug) => API.get("/team/slug/" + slug);

// Slider API
export const getSliders = () => API.get("/sliders");

// Service API
export const getServices = () => API.get("/services", fresh());
export const getServiceBySlug = (slug) => API.get("/services/slug/" + slug, fresh());
export const getServiceById = (id) => API.get("/services/" + id, fresh());
export const getSubServices = () => API.get("/sub-services");

// Project API
export const getProjects = () => API.get("/projects");
export const getProjectById = (id) => API.get("/projects/" + id);

// Testimonial API
export const getTestimonials = () => API.get("/testimonials", fresh());

// Blog API
export const getBlogs = () => API.get("/blogs", fresh());
export const getBlogBySlug = (slug) => API.get("/blogs/slug/" + slug, fresh());
export const getBlogById = (id) => API.get("/blogs/" + id, fresh());

// Contact Message API
export const submitContactMessage = (payload) => API.post("/contact-messages", payload);

// Section Content API
export const getSections = (params = {}) => API.get("/sections", { params });
export const getSectionByKey = (key, params = {}) =>
	API.get(`/sections/${encodeURIComponent(key)}`, { params });
