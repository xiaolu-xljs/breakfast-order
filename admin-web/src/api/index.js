import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import router from '../router';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截：附带 token
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// 响应拦截：统一错误提示
api.interceptors.response.use(
  (resp) => resp.data,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    if (status === 401) {
      const auth = useAuthStore();
      auth.logout();
      router.push('/login');
    }
    ElMessage.error(message || '请求失败');
    return Promise.reject(err);
  }
);

export default api;