<template>
  <div class="page">
    <div class="page-header">
      <div class="filters">
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="paid" />
          <el-option label="制作中" value="preparing" />
          <el-option label="已出餐" value="served" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button :icon="Refresh" circle @click="load" />
      </div>
      <div class="actions">
        <el-switch v-model="soundEnabled" active-text="声音提醒" @change="onSoundToggle" />
      </div>
    </div>

    <el-card>
      <el-table :data="orders" v-loading="loading" stripe row-key="id">
        <el-table-column prop="orderNo" label="订单号" min-width="170" />
        <el-table-column prop="tableNo" label="桌号" width="80" />
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="items-cell">
              <el-tag
                v-for="(it, i) in row.items"
                :key="i"
                size="small"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                {{ it.productName }} × {{ it.quantity }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="90">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS[row.status]?.type" size="small">
              {{ ORDER_STATUS[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="STATUS_NEXT[row.status]"
              type="primary"
              size="small"
              @click="advance(row)"
            >
              {{ STATUS_NEXT[row.status].label }}
            </el-button>
            <el-button
              v-if="['paid', 'preparing'].includes(row.status)"
              size="small"
              type="danger"
              text
              @click="cancel(row)"
            >
              取消
            </el-button>
            <span v-if="!STATUS_NEXT[row.status] && !['paid','preparing'].includes(row.status)" class="text-muted">
              —
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { orderApi } from '../api/orders';
import {
  formatMoney,
  formatDateTime,
  ORDER_STATUS,
  STATUS_NEXT,
} from '../utils/format';

const orders = ref([]);
const loading = ref(false);
const soundEnabled = ref(false);
const filters = reactive({ status: '', dateRange: [] });

let pollTimer = null;
let audioCtx = null;

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0] + 'T00:00:00.000Z';
      params.endDate = filters.dateRange[1] + 'T23:59:59.999Z';
    }
    const { data } = await orderApi.list(params);
    const oldIds = new Set(orders.value.map((o) => o.id));
    orders.value = data;

    // 新订单提示
    if (soundEnabled.value) {
      const newOrders = data.filter((o) => !oldIds.has(o.id) && o.status === 'paid');
      if (newOrders.length > 0) {
        playBeep();
        ElMessage.warning(`收到 ${newOrders.length} 个新订单`);
      }
    }
  } finally {
    loading.value = false;
  }
}

function reset() {
  filters.status = '';
  filters.dateRange = [];
  load();
}

async function advance(row) {
  const next = STATUS_NEXT[row.status];
  await orderApi.updateStatus(row.id, next.value);
  ElMessage.success(`订单已切换为「${ORDER_STATUS[next.value].label}」`);
  load();
}

async function cancel(row) {
  await ElMessageBox.confirm(`确认取消订单 ${row.orderNo}？`, '提示', {
    type: 'warning',
  });
  await orderApi.updateStatus(row.id, 'cancelled');
  ElMessage.success('订单已取消');
  load();
}

// 简单提示音（Web Audio API）
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn('播放提示音失败', e);
  }
}

function onSoundToggle(val) {
  if (val) {
    ElMessage.success('已开启新订单声音提醒');
  }
}

onMounted(() => {
  load();
  pollTimer = setInterval(load, 10000); // 10 秒轮询
});

onBeforeUnmount(() => clearInterval(pollTimer));
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}
.items-cell {
  display: flex;
  flex-wrap: wrap;
}
.amount {
  font-weight: 600;
  color: #f56c6c;
}
.text-muted {
  color: #c0c4cc;
}
</style>