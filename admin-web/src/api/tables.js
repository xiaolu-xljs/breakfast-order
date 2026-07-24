import api from './index';

export const tableApi = {
  list: (params) => api.get('/tables', { params }),
  detail: (id) => api.get(`/tables/${id}`),
  detailByTableNo: (tableNo) => api.get(`/tables/by-no/${encodeURIComponent(tableNo)}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  remove: (id) => api.delete(`/tables/${id}`),
  qrcode: (id) => api.get(`/tables/${id}/qrcode`),
  batchQrcode: () => api.get('/tables/qrcode/batch'),
};