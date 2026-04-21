import API from './axios'

export const getBlogs = () => API.get('/blogs?all=1')
export const getBlog = (id) => API.get(`/blogs/${id}`)
export const getBlogBySlug = (slug) => API.get(`/blogs/slug/${slug}`)
export const createBlog = (data) => API.post('/blogs', data)
export const updateBlog = (id, data) => {
    if (data instanceof FormData) {
        return API.post(`/blogs/${id}`, data, {
            headers: {
                'X-HTTP-Method-Override': 'PUT',
            },
        })
    }

    return API.put(`/blogs/${id}`, data)
}
export const toggleBlogPublished = (id) => API.patch(`/blogs/${id}/published`)
export const deleteBlog = (id) => API.delete(`/blogs/${id}`)