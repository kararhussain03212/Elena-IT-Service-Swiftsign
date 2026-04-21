import API from './axios'

export const getTeamMembers = () => API.get('/team?all=1')
export const getTeamMember = (id) => API.get(`/team/${id}`)
export const createTeamMember = (data) => API.post('/team', data)
export const updateTeamMember = (id, data) => API.put(`/team/${id}`, data)
export const toggleTeamMemberActive = (id) => API.patch(`/team/${id}/active`)
export const deleteTeamMember = (id) => API.delete(`/team/${id}`)
