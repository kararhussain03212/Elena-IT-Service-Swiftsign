import API from './axios'

export const getProgramApplications = (params = {}) => API.get('/program-applications', { params })
export const updateProgramApplicationStatus = (id, status) => API.patch(`/program-applications/${id}`, { status })
