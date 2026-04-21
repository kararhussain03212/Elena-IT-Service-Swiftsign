import API from "./axios";

export const getSections = (params = {}) =>
  API.get("/sections", { params: { all: 1, ...params } });

export const getSectionById = (id) =>
  API.get(`/sections/id/${id}`, { params: { all: 1 } });

export const getSectionByKey = (key) =>
  API.get(`/sections/${encodeURIComponent(key)}`, { params: { all: 1 } });

export const createSection = (payload) => API.post("/sections", payload);

export const updateSection = (id, payload) =>
  API.put(`/sections/${id}`, payload);

export const toggleSectionActive = (id) =>
  API.patch(`/sections/${id}/active`);

export const deleteSection = (id) => API.delete(`/sections/${id}`);

export const uploadSectionImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return API.post("/sections/upload-image", formData);
};
