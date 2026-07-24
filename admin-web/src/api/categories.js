import api from './index';

export const categoryApi = {
  list: (params) => api.get('/categories', { params }),
  detail: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};