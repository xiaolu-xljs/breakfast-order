import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'orders', component: () => import('../views/Orders.vue') },
      { path: 'categories', component: () => import('../views/Categories.vue') },
      { path: 'products', component: () => import('../views/Products.vue') },
      { path: 'tables', component: () => import('../views/Tables.vue') },
      { path: 'stats', component: () => import('../views/Stats.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue'), meta: { public: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.token) {
    return next('/login');
  }
  next();
});

export default router;