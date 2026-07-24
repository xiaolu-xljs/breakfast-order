import api from './index';

export const statsApi = {
  overview: () => api.get('/stats/overview'),
  range: (params) => api.get('/stats/range', { params }),
};