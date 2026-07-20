import API from './axios'

export const getCertifications = () => API.get('/certifications')
export const getCertificationById = (id) => API.get(`/certifications/by-id/${id}`)
export const createCertification = (data) => {
    if (data instanceof FormData) {
        return API.post('/certifications', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
    return API.post('/certifications', data)
}
export const updateCertification = (id, data) => {
    if (data instanceof FormData) {
        return API.post(`/certifications/${id}`, data, {
            headers: {
                'X-HTTP-Method-Override': 'PUT',
                'Content-Type': 'multipart/form-data'
            }
        })
    }
    return API.put(`/certifications/${id}`, data)
}
export const deleteCertification = (id) => API.delete(`/certifications/${id}`)
