import API from "./axios";

export const getContactMessages = (params = {}) => API.get("/contact-messages", { params });
export const toggleContactMessageRead = (id, isRead) =>
    API.patch(`/contact-messages/${id}/read`, { isRead });
export const deleteContactMessage = (id) => API.delete(`/contact-messages/${id}`);
