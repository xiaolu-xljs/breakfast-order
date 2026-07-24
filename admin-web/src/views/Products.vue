<template>
  <div class="page">
    <div class="page-header">
      <div class="filters">
        <el-select v-model="filters.categoryId" placeholder="全部分类" clearable style="width: 140px">
          <el-option
            v-for="c in categories"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
        <el-select v-model="filters.isAvailable" placeholder="全部状态" clearable style="width: 120px">
          <el-option label="可售" :value="true" />
          <el-option label="已下架" :value="false" />
        </el-select>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建商品</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe row-key="id">
        <el-table-column label="图片" width="70">
          <template #default="{ row }">
            <img v-if="row.imageUrl" :src="row.imageUrl" class="image-thumb" />
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category?.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isAvailable"
              active-text="可售"
              inactive-text="下架"
              inline-prompt
              @change="onToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除「${row.name}」？`" @confirm="onDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新建商品'" width="520">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单价（元）" prop="price">
          <el-input-number v-model="form.price" :min="0" :max="9999" :precision="1" :step="0.5" />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="uploadImage"
            accept="image/*"
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" class="image-preview" />
            <el-button v-else>选择图片</el-button>
          </el-upload>
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            支持 jpg/png/webp/gif，≤ 2MB
          </div>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="立即上架">
          <el-switch v-model="form.isAvailable" />
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
import { productApi } from '../api/products';
import { categoryApi } from '../api/categories';
import { uploadApi } from '../api/upload';
import { formatMoney } from '../utils/format';

const list = ref([]);
const categories = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref(null);

const filters = reactive({ categoryId: null, isAvailable: null });

const blank = () => ({
  id: null,
  name: '',
  categoryId: null,
  price: 0,
  description: '',
  imageUrl: '',
  isAvailable: true,
  sortOrder: 0,
});
const form = reactive(blank());

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
};

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.isAvailable !== null) params.isAvailable = filters.isAvailable;
    const { data } = await productApi.list(params);
    list.value = data;
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  const { data } = await categoryApi.list();
  categories.value = data;
}

function reset() {
  filters.categoryId = null;
  filters.isAvailable = null;
  load();
}

function openDialog(row) {
  Object.assign(form, blank());
  if (row) {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      price: row.price,
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      isAvailable: row.isAvailable,
      sortOrder: row.sortOrder,
    });
  }
  dialogVisible.value = true;
}

async function onSubmit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      isAvailable: form.isAvailable,
      sortOrder: form.sortOrder,
    };
    if (form.id) {
      await productApi.update(form.id, payload);
      ElMessage.success('更新成功');
    } else {
      await productApi.create(payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    load();
  } finally {
    submitting.value = false;
  }
}

async function onToggle(row) {
  await productApi.update(row.id, { isAvailable: row.isAvailable });
  ElMessage.success(row.isAvailable ? '已上架' : '已下架');
}

async function onDelete(row) {
  await productApi.remove(row.id);
  ElMessage.success('已删除');
  load();
}

// 上传处理
function beforeUpload(file) {
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片不能超过 2MB');
    return false;
  }
  return true;
}

async function uploadImage(option) {
  try {
    const { data } = await uploadApi.image(option.file);
    form.imageUrl = data.url.startsWith('http') ? data.url : location.origin + data.url;
    ElMessage.success('上传成功');
  } catch (e) {
    // 已全局提示
  }
}

onMounted(() => {
  load();
  loadCategories();
});
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
}
.amount {
  font-weight: 600;
  color: #f56c6c;
}
.text-muted {
  color: #c0c4cc;
}
.image-preview {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  object-fit: cover;
}
</style>