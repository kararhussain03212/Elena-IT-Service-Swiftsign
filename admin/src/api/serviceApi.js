import API from "./axios";

export const getServices = () => API.get("/services?all=1");
export const getService = (id) => API.get("/services/" + id);
export const createService = (data) => API.post("/services", data);
export const updateService = (id, data) => API.put("/services/" + id, data);
export const toggleServiceActive = (id) => API.patch("/services/" + id + "/active");
export const deleteService = (id) => API.delete("/services/" + id);