<template>
  <div class="page">
    <div class="stats">
      <div class="stat-card">
        <div class="label">今日订单</div>
        <div class="value">{{ data.today?.orderCount || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待处理 / 制作中</div>
        <div class="value">
          {{ data.pendingCount || 0 }} / {{ data.preparingCount || 0 }}
        </div>
      </div>
      <div class="stat-card">
        <div class="label">今日营业额</div>
        <div class="value">¥{{ formatMoney(data.today?.revenue) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">在售商品 / 餐桌</div>
        <div class="value">{{ data.productCount || 0 }} / {{ data.tableCount || 0 }}</div>
      </div>
    </div>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>待处理订单</span>
              <el-button text type="primary" @click="$router.push('/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-empty v-if="!data.pendingOrders?.length" description="暂无待处理订单" />
          <div v-else class="pending-list">
            <div v-for="o in data.pendingOrders" :key="o.id" class="pending-item">
              <div class="left">
                <div class="title">
                  <el-tag :type="o.status === 'paid' ? 'warning' : 'primary'" size="small">
                    {{ o.status === 'paid' ? '待处理' : '制作中' }}
                  </el-tag>
                  <span class="table">桌号 {{ o.tableNo }}</span>
                </div>
                <div class="items">{{ o.itemNames.join('、') }}</div>
              </div>
              <div class="right">
                <div class="amount">¥{{ formatMoney(o.totalAmount) }}</div>
                <div class="time">{{ formatTime(o.createdAt) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header>
            <span>近 30 天热销 TOP 5</span>
          </template>
          <el-empty v-if="!data.hotProducts?.length" description="暂无销售数据" />
          <div v-else class="hot-list">
            <div v-for="(p, i) in data.hotProducts" :key="p.productId" class="hot-item">
              <span class="rank" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
              <span class="name">{{ p.name }}</span>
              <span class="qty">× {{ p.quantity }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { statsApi } from '../api/stats';
import { formatMoney, formatTime } from '../utils/format';

const data = ref({});
let timer = null;

async function load() {
  const resp = await statsApi.overview();
  data.value = resp.data;
}

onMounted(() => {
  load();
  // 30 秒自动刷新，方便观察新订单
  timer = setInterval(load, 30000);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.pending-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
}
.pending-item:last-child {
  border-bottom: none;
}
.pending-item .title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.pending-item .table {
  color: #909399;
  font-size: 13px;
}
.pending-item .items {
  color: #606266;
  font-size: 14px;
}
.pending-item .amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}
.pending-item .time {
  font-size: 12px;
  color: #909399;
  text-align: right;
}
.hot-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 12px;
}
.hot-item .rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #909399;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.hot-item .rank-1 { background: #f56c6c; }
.hot-item .rank-2 { background: #e6a23c; }
.hot-item .rank-3 { background: #67c23a; }
.hot-item .name { flex: 1; }
.hot-item .qty { color: #909399; }
</style>