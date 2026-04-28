import API from "./axios";

export const getSubServices = () => API.get("/sub-services?all=1");
export const getSubService = (id) => API.get("/sub-services/" + id);
export const createSubService = (data) => API.post("/sub-services", data);
export const updateSubService = (id, data) => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    if (!data.has("_method")) {
      data.append("_method", "PUT");
    }
    return API.post("/sub-services/" + id, data);
  }
  return API.put("/sub-services/" + id, data);
};
export const toggleSubServiceActive = (id) => API.patch("/sub-services/" + id + "/active");
export const deleteSubService = (id) => API.delete("/sub-services/" + id);
