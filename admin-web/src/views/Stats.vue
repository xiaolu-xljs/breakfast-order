<template>
  <div class="page">
    <div class="page-header">
      <div class="filters">
        <el-radio-group v-model="rangeKey" @change="load">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">近 7 天</el-radio-button>
          <el-radio-button label="month">近 30 天</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="onCustomRange"
          style="margin-left: 12px"
        />
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="label">订单数</div>
        <div class="value">{{ totals.orderCount }}</div>
      </div>
      <div class="stat-card">
        <div class="label">营业额</div>
        <div class="value">¥{{ formatMoney(totals.revenue) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">客单价</div>
        <div class="value">
          ¥{{
            totals.orderCount > 0
              ? formatMoney(totals.revenue / totals.orderCount)
              : '0.00'
          }}
        </div>
      </div>
    </div>

    <el-card style="margin-top: 16px">
      <template #header><span>营业额趋势</span></template>
      <div v-if="!series.length" class="empty">暂无数据</div>
      <svg v-else :viewBox="`0 0 ${chartW} ${chartH}`" class="chart">
        <!-- 网格 -->
        <line
          v-for="(g, i) in 5"
          :key="i"
          :x1="40"
          :x2="chartW - 20"
          :y1="20 + (i * (chartH - 60)) / 4"
          :y2="20 + (i * (chartH - 60)) / 4"
          stroke="#ebeef5"
          stroke-dasharray="3 3"
        />
        <!-- Y 轴标签 -->
        <text
          v-for="(g, i) in 5"
          :key="'y' + i"
          :x="0"
          :y="24 + (i * (chartH - 60)) / 4"
          font-size="10"
          fill="#909399"
        >{{ yLabel(i) }}</text>
        <!-- 折线 -->
        <polyline
          :points="linePoints"
          fill="none"
          stroke="#ff6b35"
          stroke-width="2"
        />
        <!-- 点 -->
        <circle
          v-for="(p, i) in dotPoints"
          :key="i"
          :cx="p.x"
          :cy="p.y"
          r="3"
          fill="#ff6b35"
        >
          <title>{{ p.label }}</title>
        </circle>
        <!-- X 轴标签 -->
        <text
          v-for="(p, i) in dotPoints"
          :key="'x' + i"
          :x="p.x"
          :y="chartH - 5"
          font-size="10"
          fill="#909399"
          text-anchor="middle"
        >{{ p.short }}</text>
      </svg>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header><span>商品销量 TOP 20</span></template>
      <el-table :data="hotProducts" stripe>
        <el-table-column type="index" label="排名" width="70" />
        <el-table-column prop="name" label="商品" />
        <el-table-column label="销量" width="120">
          <template #default="{ row }">× {{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="销售额" width="140">
          <template #default="{ row }">¥{{ formatMoney(row.revenue) }}</template>
        </el-table-column>
        <el-table-column label="占比">
          <template #default="{ row }">
            <el-progress
              :percentage="percentageOf(row)"
              :stroke-width="14"
              :color="['#ff6b35', '#ff9558']"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { statsApi } from '../api/stats';
import { formatMoney } from '../utils/format';

const rangeKey = ref('week');
const customRange = ref([]);
const series = ref([]);
const hotProducts = ref([]);
const totals = reactive({ orderCount: 0, revenue: 0 });

const chartW = 800;
const chartH = 260;

const dotPoints = computed(() => {
  if (!series.value.length) return [];
  const maxRev = Math.max(...series.value.map((s) => s.revenue), 1);
  const stepX = (chartW - 80) / Math.max(series.value.length - 1, 1);
  return series.value.map((s, i) => ({
    x: 40 + i * stepX,
    y: chartH - 40 - (s.revenue / maxRev) * (chartH - 60),
    label: `${s.date}\n订单 ${s.orderCount} 单\n营业额 ¥${formatMoney(s.revenue)}`,
    short: s.date.slice(5), // MM-DD
  }));
});

const linePoints = computed(() =>
  dotPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
);

function yLabel(i) {
  const maxRev = Math.max(...series.value.map((s) => s.revenue), 1);
  const v = maxRev - (i * maxRev) / 4;
  return '¥' + formatMoney(v);
}

function percentageOf(row) {
  const totalQty = hotProducts.value.reduce((s, p) => s + p.quantity, 0) || 1;
  return Math.round((row.quantity / totalQty) * 100);
}

async function load() {
  const params = {};
  if (customRange.value?.length === 2) {
    params.start = customRange.value[0];
    params.end = customRange.value[1];
  } else {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    if (rangeKey.value === 'today') {
      params.start = end;
      params.end = end;
    } else if (rangeKey.value === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (rangeKey.value === 'month') {
      start.setDate(start.getDate() - 29);
    }
    params.start = start.toISOString().slice(0, 10);
    params.end = end;
  }
  const { data } = await statsApi.range(params);
  series.value = data.series;
  hotProducts.value = data.hotProducts;
  totals.orderCount = data.totals.orderCount;
  totals.revenue = data.totals.revenue;
}

function onCustomRange() {
  rangeKey.value = '';
  load();
}

onMounted(load);
</script>

<style scoped>
.page-header {
  margin-bottom: 16px;
}
.filters {
  display: flex;
  align-items: center;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.stat-card .label {
  color: #909399;
  font-size: 13px;
}
.stat-card .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-top: 6px;
}
.chart {
  width: 100%;
  height: 280px;
}
.empty {
  text-align: center;
  color: #909399;
  padding: 60px 0;
}
</style>