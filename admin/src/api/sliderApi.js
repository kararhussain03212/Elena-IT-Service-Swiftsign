import API from './axios'

export const getSliders = () => API.get('/sliders?all=1')
export const getSlider = (id) => API.get(`/sliders/${id}`)
export const createSlider = (data) => API.post('/sliders', data)
export const updateSlider = (id, data) => {
  const payload = data instanceof FormData ? new FormData() : {}
  if (data instanceof FormData) {
    data.forEach((value, key) => payload.append(key, value))
    payload.append('_method', 'PUT')
  } else {
    Object.assign(payload, data, { _method: 'PUT' })
  }
  return API.post(`/sliders/${id}`, payload)
}
export const toggleSliderActive = (id) => API.patch(`/sliders/${id}/active`)
export const deleteSlider = (id) => API.delete(`/sliders/${id}`)
