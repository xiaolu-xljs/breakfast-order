<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">🍜 早餐店管理</div>
      <el-menu
        :default-active="route.path"
        router
        class="menu"
        background-color="#001529"
        text-color="#cfd3dc"
        active-text-color="#ffd04b"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>菜单分类</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/tables">
          <el-icon><Grid /></el-icon>
          <span>餐桌管理</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><TrendCharts /></el-icon>
          <span>营业统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="title">{{ pageTitle }}</div>
        <div class="user">
          <el-icon><User /></el-icon>
          <span>{{ auth.admin?.name || '店主' }}</span>
          <el-button text type="primary" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const TITLE_MAP = {
  '/dashboard': '数据概览',
  '/orders': '订单管理',
  '/categories': '菜单分类',
  '/products': '商品管理',
  '/tables': '餐桌管理',
  '/stats': '营业统计',
};

const pageTitle = computed(() => TITLE_MAP[route.path] || '');

function onLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #001529;
  color: #fff;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #ffd04b;
  border-bottom: 1px solid #1f3a5c;
}
.menu {
  border-right: none;
}
.menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
.menu :deep(.el-menu-item.is-active) {
  background: #1f3a5c !important;
}
.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}
.main {
  background: #f5f7fa;
  padding: 20px;
}
</style>