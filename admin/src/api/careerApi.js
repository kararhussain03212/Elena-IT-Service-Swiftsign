import API from './axios'

// Career Page Content (singleton)
export const getCareerPage = () => API.get('/career-page')
export const updateCareerPage = (data) => API.patch('/career-page', data)

// Career Programs
export const getAdminCareerPrograms = () => API.get('/admin/career-programs')
export const getCareerProgramById = (id) => API.get(`/career-programs/${id}`)
export const createCareerProgram = (data) => API.post('/career-programs', data)
export const updateCareerProgram = (id, data) => API.put(`/career-programs/${id}`, data)
export const deleteCareerProgram = (id) => API.delete(`/career-programs/${id}`)

// Program Modules (nested)
export const addCareerProgramModule = (programId, data) => API.post(`/career-programs/${programId}/modules`, data)
export const updateCareerProgramModule = (programId, moduleId, data) => API.put(`/career-programs/${programId}/modules/${moduleId}`, data)
export const deleteCareerProgramModule = (programId, moduleId) => API.delete(`/career-programs/${programId}/modules/${moduleId}`)
export const reorderCareerProgramModules = (programId, moduleIds) => API.patch(`/career-programs/${programId}/modules/reorder`, { moduleIds })
