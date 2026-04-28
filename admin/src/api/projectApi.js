import API from "./axios";

export const getProjects = () => API.get("/projects?all=1");
export const getProject = (id) => API.get("/projects/" + id);
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    if (!data.has("_method")) {
      data.append("_method", "PUT");
    }
    return API.post("/projects/" + id, data);
  }
  return API.put("/projects/" + id, data);
};
export const toggleProjectActive = (id) => API.patch("/projects/" + id + "/active");
export const deleteProject = (id) => API.delete("/projects/" + id);
