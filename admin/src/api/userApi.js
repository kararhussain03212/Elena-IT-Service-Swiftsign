import API from "./axios";

export const getUsers = (params = {}) => API.get("/users", { params });

export const createUser = (payload) => API.post("/users", payload);

export const updateUser = (id, payload) => API.put(`/users/${id}`, payload);

export const deleteUser = (id) => API.delete(`/users/${id}`);
