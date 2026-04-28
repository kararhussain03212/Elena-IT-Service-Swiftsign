import API from "./axios";

export const getUsers = (params = {}) => API.get("/users", { params });

export const createUser = (payload) => API.post("/users", payload);

export const updateUser = (id, payload) => {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    if (!payload.has("_method")) {
      payload.append("_method", "PUT");
    }
    return API.post(`/users/${id}`, payload);
  }
  return API.put(`/users/${id}`, payload);
};

export const deleteUser = (id) => API.delete(`/users/${id}`);
