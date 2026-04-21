import API from './axios'

export const loginUser    = (data) => API.post('/auth/login', data)
export const getMe        = ()     => API.get('/auth/me')
export const updateMe     = async (data) => {
  const payload = data instanceof FormData ? new FormData() : null
  if (payload) {
    data.forEach((value, key) => payload.append(key, value))
    payload.append('_method', 'PATCH')
    return API.post('/auth/me', payload)
  }

  try {
    return await API.patch('/auth/me', data)
  } catch (error) {
    if (error?.response?.status !== 404) throw error
  }

  let authUser = null
  try {
    authUser = JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch {
    authUser = null
  }

  const userId = authUser?.id
  if (!userId) {
    throw new Error('Profile endpoint is unavailable. Please restart backend server.')
  }

  const updateResponse = await API.put(`/users/${userId}`, data)
  const user = updateResponse?.data?.data || {}
  return {
    ...updateResponse,
    data: {
      ...updateResponse?.data,
      user: {
        ...user,
        id: user?.id || user?._id || userId,
      },
    },
  }
}
export const changeMyPassword = async (data) => {
  try {
    return await API.patch('/auth/me/password', data)
  } catch (error) {
    if (error?.response?.status !== 404) throw error
  }

  // Backward-compat fallback for older backend versions:
  // 1) verify current password with /auth/login
  // 2) update own password through /users/:id (admin-protected route)
  let authUser = null
  try {
    authUser = JSON.parse(localStorage.getItem('authUser') || 'null')
  } catch {
    authUser = null
  }

  const userId = authUser?.id
  const email = String(authUser?.email || '').trim().toLowerCase()
  const currentPassword = String(data?.currentPassword || '')
  const newPassword = String(data?.newPassword || '')

  if (!userId || !email) {
    throw new Error('Password endpoint is unavailable. Please restart backend server.')
  }

  try {
    await API.post('/auth/login', { email, password: currentPassword })
  } catch (verifyError) {
    const status = verifyError?.response?.status
    if (status === 401) {
      throw new Error('Current password is incorrect.')
    }
    throw verifyError
  }

  const updateResponse = await API.put(`/users/${userId}`, { password: newPassword })
  return {
    ...updateResponse?.data,
    message: updateResponse?.data?.message || 'Password changed successfully.',
  }
}
