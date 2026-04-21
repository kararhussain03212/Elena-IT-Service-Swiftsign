import API from "./axios";

export const getSubServices = () => API.get("/sub-services?all=1");
export const getSubService = (id) => API.get("/sub-services/" + id);
export const createSubService = (data) => API.post("/sub-services", data);
export const updateSubService = (id, data) => API.put("/sub-services/" + id, data);
export const toggleSubServiceActive = (id) => API.patch("/sub-services/" + id + "/active");
export const deleteSubService = (id) => API.delete("/sub-services/" + id);
