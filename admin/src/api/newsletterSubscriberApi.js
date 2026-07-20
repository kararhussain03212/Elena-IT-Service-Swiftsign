import API from './axios'

export const getNewsletterSubscribers = (params = {}) => API.get('/newsletter-subscribers', { params })

export const exportNewsletterSubscribersCsv = () =>
    API.get('/newsletter-subscribers', { params: { export: 'csv' }, responseType: 'blob' })
