<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">餐桌管理（共 {{ list.length }} 张）</div>
      <div>
        <el-button @click="batchQrcode">批量生成二维码</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新建餐桌</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe row-key="id">
        <el-table-column prop="tableNo" label="桌号" width="120" />
        <el-table-column label="启用" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除「${row.tableNo}」？`" @confirm="onDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
            <el-button size="small" type="success" @click="showQrcode(row)">
              二维码
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑餐桌' : '新建餐桌'" width="420">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80">
        <el-form-item label="桌号" prop="tableNo">
          <el-input v-model="form.tableNo" maxlength="20" placeholder="如 A01、B12" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 二维码对话框 -->
    <el-dialog v-model="qrDialogVisible" title="餐桌二维码" width="360">
      <div class="qr-box">
        <div class="qr-title">桌号：{{ qrInfo?.tableNo }}</div>
        <img v-if="qrInfo?.url" :src="fullUrl(qrInfo.url)" class="qr-img" />
        <div class="qr-hint">
          扫码内容：<br />
          <code>{{ qrInfo?.content }}</code>
        </div>
        <div class="qr-tip">
          打印贴到桌上即可。手机扫码会自动进入小程序菜单页。
        </div>
      </div>
      <template #footer>
        <el-button @click="downloadQr">下载图片</el-button>
        <el-button type="primary" @click="qrDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { tableApi } from '../api/tables';
import { formatDateTime } from '../utils/format';

const list = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref(null);

const qrDialogVisible = ref(false);
const qrInfo = ref(null);

const blank = () => ({ id: null, tableNo: '', isActive: true });
const form = reactive(blank());

const rules = {
  tableNo: [{ required: true, message: '请输入桌号', trigger: 'blur' }],
};

async function load() {
  loading.value = true;
  try {
    const { data } = await tableApi.list();
    list.value = data;
  } finally {
    loading.value = false;
  }
}

function openDialog(row) {
  Object.assign(form, blank());
  if (row) Object.assign(form, row);
  dialogVisible.value = true;
}

async function onSubmit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    if (form.id) {
      await tableApi.update(form.id, { tableNo: form.tableNo, isActive: form.isActive });
      ElMessage.success('更新成功');
    } else {
      await tableApi.create({ tableNo: form.tableNo, isActive: form.isActive });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    load();
  } finally {
    submitting.value = false;
  }
}

async function onToggle(row) {
  await tableApi.update(row.id, { isActive: row.isActive });
  ElMessage.success(row.isActive ? '已启用' : '已停用');
}

async function onDelete(row) {
  await tableApi.remove(row.id);
  ElMessage.success('已删除');
  load();
}

// 二维码相关
async function showQrcode(row) {
  loading.value = true;
  try {
    const { data } = await tableApi.qrcode(row.id);
    qrInfo.value = data;
    qrDialogVisible.value = true;
  } catch (err) {
    ElMessage.error('生成二维码失败：' + (err.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

async function batchQrcode() {
  await ElMessageBox.confirm('将为所有启用的餐桌重新生成二维码，确认？', '提示', { type: 'info' });
  loading.value = true;
  try {
    const { data } = await tableApi.batchQrcode();
    ElMessage.success(`已生成 ${data.length} 张二维码，存到 public/qrcodes/`);
    if (data.length) {
      qrInfo.value = data[0];
      qrDialogVisible.value = true;
    }
  } catch (err) {
    ElMessage.error('批量生成失败：' + (err.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

function fullUrl(url) {
  if (url.startsWith('http')) return url;
  // 商家后台在 5173，二维码图片在 3000，必须用后端完整地址
  // 生产环境 vite build 后这里改成正式域名
  return `http://localhost:3000${url}`;
}

function downloadQr() {
  if (!qrInfo.value) return;
  const a = document.createElement('a');
  a.href = fullUrl(qrInfo.value.url);
  a.download = `桌号-${qrInfo.value.tableNo}.png`;
  a.click();
}

onMounted(load);
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.qr-box {
  text-align: center;
}
.qr-title {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b35;
  margin-bottom: 12px;
}
.qr-img {
  width: 240px;
  height: 240px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
.qr-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}
.qr-hint code {
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}
.qr-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>