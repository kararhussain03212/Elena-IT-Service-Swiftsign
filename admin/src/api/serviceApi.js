import API from "./axios";

export const getServices = () => API.get("/services?all=1");
export const getService = (id) => API.get("/services/" + id);
export const createService = (data) => API.post("/services", data);
// PHP does not reliably populate `$_FILES` for PUT requests. Use POST with method override for updates
// so multipart FormData (image uploads) works consistently.
export const updateService = (id, data) =>
  API.post("/services/" + id, data, {
    headers: {
      "X-HTTP-Method-Override": "PUT",
    },
  });
export const toggleServiceActive = (id) => API.patch("/services/" + id + "/active");
export const deleteService = (id) => API.delete("/services/" + id);
