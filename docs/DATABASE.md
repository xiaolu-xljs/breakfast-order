# 数据库设计详情

本文档说明表结构、字段含义、关系以及 Prisma schema 写法。

## 关系总览

```
categories (1) ──< (n) products
tables     (1) ──< (n) orders
orders     (1) ──< (n) order_items
products   (1) ──< (n) order_items
```

## 状态枚举

订单状态使用字符串存储：

- `paid` — 已付款，等待商家处理
- `preparing` — 制作中
- `served` — 已出餐
- `completed` — 已完成（顾客确认收货）
- `cancelled` — 已取消（仅商家在出餐前可取消）

## Prisma Schema 示例

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // 上线时改为 mysql
  url      = env("DATABASE_URL")
}

model Category {
  id         Int       @id @default(autoincrement())
  name       String
  sortOrder  Int       @default(0) @map("sort_order")
  isActive   Boolean   @default(true) @map("is_active")
  createdAt  DateTime  @default(now()) @map("created_at")
  products   Product[]

  @@map("categories")
}

model Product {
  id          Int       @id @default(autoincrement())
  categoryId  Int       @map("category_id")
  name        String
  price       Decimal
  description String?
  imageUrl    String?   @map("image_url")
  isAvailable Boolean   @default(true) @map("is_available")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  category    Category  @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]

  @@index([categoryId])
  @@map("products")
}

model Table {
  id         Int       @id @default(autoincrement())
  tableNo    String    @unique @map("table_no")
  isActive   Boolean   @default(true) @map("is_active")
  createdAt  DateTime  @default(now()) @map("created_at")
  orders     Order[]

  @@map("tables")
}

model Order {
  id          Int         @id @default(autoincrement())
  orderNo     String      @unique @map("order_no")
  tableId     Int         @map("table_id")
  totalAmount Decimal     @map("total_amount")
  status      String      @default("paid")
  openid      String?
  paidAt      DateTime?   @map("paid_at")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  table       Table       @relation(fields: [tableId], references: [id])
  items       OrderItem[]

  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          Int     @id @default(autoincrement())
  orderId     Int     @map("order_id")
  productId   Int     @map("product_id")
  productName String  @map("product_name")
  price       Decimal
  quantity    Int
  subtotal    Decimal

  order       Order   @relation(fields: [orderId], references: [id])
  product     Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}

model Admin {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  passwordHash String   @map("password_hash")
  name         String
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("admins")
}
```

## 索引说明

- `categories.isActive`：菜单查询过滤
- `products.categoryId`：分类查询商品
- `tables.tableNo`：扫码解析桌号
- `orders.orderNo`：顾客查询订单（订单号）
- `orders.status`：商家后台按状态筛选
- `orders.createdAt`：日期范围查询
- `orderItems.orderId`：订单明细查询

## 上线切换 MySQL

把 `schema.prisma` 中：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

改为：

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

并安装 `mysql2` 驱动，然后 `npx prisma migrate dev` 重新生成迁移文件即可。