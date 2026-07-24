<template>
  <div class="page">
    <div class="page-header">
      <div class="page-title">菜单分类（共 {{ list.length }} 个）</div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建分类</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe row-key="id">
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column label="商品数" width="100">
          <template #default="{ row }">
            {{ row._count?.products ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm
              :title="`确认删除「${row.name}」？`"
              @confirm="onDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :disabled="row._count?.products > 0">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑分类' : '新建分类'" width="420">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
          <span style="margin-left: 8px; color: #909399; font-size: 12px">数字小排前</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { categoryApi } from '../api/categories';

const list = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref(null);

const blank = () => ({ id: null, name: '', sortOrder: 0, isActive: true });
const form = reactive(blank());

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

async function load() {
  loading.value = true;
  try {
    const { data } = await categoryApi.list();
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
      await categoryApi.update(form.id, {
        name: form.name,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      ElMessage.success('更新成功');
    } else {
      await categoryApi.create({
        name: form.name,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    load();
  } finally {
    submitting.value = false;
  }
}

async function onToggle(row) {
  await categoryApi.update(row.id, { isActive: row.isActive });
  ElMessage.success(row.isActive ? '已启用' : '已停用');
}

async function onDelete(row) {
  await categoryApi.remove(row.id);
  ElMessage.success('已删除');
  load();
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
</style>