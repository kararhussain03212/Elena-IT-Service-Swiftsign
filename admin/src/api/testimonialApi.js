import API from "./axios";

export const getTestimonials = () => API.get("/testimonials?all=1");
export const getTestimonial = (id) => API.get("/testimonials/" + id);
export const createTestimonial = (data) => API.post("/testimonials", data);
export const updateTestimonial = (id, data) => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    if (!data.has("_method")) {
      data.append("_method", "PUT");
    }
    return API.post("/testimonials/" + id, data);
  }
  return API.put("/testimonials/" + id, data);
};
export const toggleTestimonialActive = (id) => API.patch("/testimonials/" + id + "/active");
export const deleteTestimonial = (id) => API.delete("/testimonials/" + id);
