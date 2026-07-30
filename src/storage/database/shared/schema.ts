import { pgTable, serial, varchar, text, integer, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============ 仓库 ============
export const warehouses = pgTable("warehouses", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

// ============ 客户 ============
export const customers = pgTable("customers", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  country: varchar("country", { length: 50 }).notNull(),
  city: varchar("city", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  categories: text("categories"), // JSON array string
  frequent_categories: text("frequent_categories"), // JSON array string
  last_purchase_date: varchar("last_purchase_date", { length: 20 }),
  total_sales: numeric("total_sales", { precision: 12, scale: 2 }).default("0").notNull(),
  order_receivable: numeric("order_receivable", { precision: 12, scale: 2 }).default("0").notNull(),
  shipped_debt: numeric("shipped_debt", { precision: 12, scale: 2 }).default("0").notNull(),
  presave_balance: numeric("presave_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  pre_deposit: numeric("pre_deposit", { precision: 12, scale: 2 }).default("0").notNull(),
  last_payment_date: varchar("last_payment_date", { length: 20 }),
  pending_ship_qty: integer("pending_ship_qty").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("一般"),
  common_sizes: text("common_sizes"), // JSON array string
  avg_order_amount: numeric("avg_order_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  purchase_frequency: varchar("purchase_frequency", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("customers_country_idx").on(table.country),
  index("customers_status_idx").on(table.status),
]);

// ============ 商品 ============
export const products = pgTable("products", {
  id: varchar("id", { length: 10 }).primaryKey(),
  style_no: varchar("style_no", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  colors: text("colors").notNull(), // JSON array of {name, hex}
  sizes: text("sizes").notNull(), // JSON array string
  images: text("images"), // JSON array string
  current_stock: integer("current_stock").default(0).notNull(),
  suggested_price: numeric("suggested_price", { precision: 10, scale: 2 }).default("0").notNull(),
  last_cost: numeric("last_cost", { precision: 10, scale: 2 }).default("0").notNull(),
  new_date: varchar("new_date", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("设计中"),
  description: text("description"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("products_style_no_idx").on(table.style_no),
  index("products_category_idx").on(table.category),
  index("products_status_idx").on(table.status),
]);

// ============ 工厂 ============
export const factories = pgTable("factories", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  contact: varchar("contact", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  main_category: varchar("main_category", { length: 50 }),
  total_production_amount: numeric("total_production_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  paid_amount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  unpaid_amount: numeric("unpaid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  last_coop_date: varchar("last_coop_date", { length: 20 }),
  address: varchar("address", { length: 255 }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

// ============ 生产批次 ============
export const production_batches = pgTable("production_batches", {
  id: varchar("id", { length: 10 }).primaryKey(),
  batch_no: varchar("batch_no", { length: 20 }).notNull().unique(),
  factory_id: varchar("factory_id", { length: 10 }).notNull().references(() => factories.id),
  product_id: varchar("product_id", { length: 10 }).notNull().references(() => products.id),
  style_no: varchar("style_no", { length: 20 }).notNull(),
  product_name: varchar("product_name", { length: 100 }),
  color: varchar("color", { length: 30 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantity: integer("quantity").notNull(),
  unit_cost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  total_cost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
  inbound_warehouse_id: varchar("inbound_warehouse_id", { length: 10 }).references(() => warehouses.id),
  warehouse_id: varchar("warehouse_id", { length: 10 }).references(() => warehouses.id),
  inbound_date: varchar("inbound_date", { length: 20 }),
  start_date: varchar("start_date", { length: 20 }),
  inbound_quantity: integer("inbound_quantity").default(0).notNull(),
  paid_amount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  unpaid_amount: numeric("unpaid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("待生产"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("production_batches_factory_id_idx").on(table.factory_id),
  index("production_batches_product_id_idx").on(table.product_id),
  index("production_batches_style_no_idx").on(table.style_no),
  index("production_batches_status_idx").on(table.status),
]);

// ============ 订单 ============
export const orders = pgTable("orders", {
  id: varchar("id", { length: 10 }).primaryKey(),
  order_no: varchar("order_no", { length: 20 }).notNull().unique(),
  customer_id: varchar("customer_id", { length: 10 }).notNull().references(() => customers.id),
  customer_name: varchar("customer_name", { length: 100 }),
  country: varchar("country", { length: 50 }),
  order_date: varchar("order_date", { length: 20 }).notNull(),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  paid_amount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  unpaid_amount: numeric("unpaid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  total_quantity: integer("total_quantity").default(0).notNull(),
  shipped_quantity: integer("shipped_quantity").default(0).notNull(),
  pending_ship_quantity: integer("pending_ship_quantity").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("草稿"),
  presave_deduction: numeric("presave_deduction", { precision: 12, scale: 2 }).default("0").notNull(),
  final_receivable: numeric("final_receivable", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("orders_customer_id_idx").on(table.customer_id),
  index("orders_status_idx").on(table.status),
  index("orders_order_date_idx").on(table.order_date),
]);

// ============ 订单明细 ============
export const order_items = pgTable("order_items", {
  id: varchar("id", { length: 10 }).primaryKey(),
  order_id: varchar("order_id", { length: 10 }).notNull().references(() => orders.id),
  product_id: varchar("product_id", { length: 10 }).notNull().references(() => products.id),
  style_no: varchar("style_no", { length: 20 }).notNull(),
  product_name: varchar("product_name", { length: 100 }),
  color: varchar("color", { length: 30 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  warehouse_id: varchar("warehouse_id", { length: 10 }).references(() => warehouses.id),
  warehouse_name: varchar("warehouse_name", { length: 100 }),
  available_stock: integer("available_stock").default(0).notNull(),
  quantity: integer("quantity").notNull(),
  shipped_quantity: integer("shipped_quantity").default(0).notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.order_id),
  index("order_items_product_id_idx").on(table.product_id),
]);

// ============ 发货单 ============
export const shipments = pgTable("shipments", {
  id: varchar("id", { length: 10 }).primaryKey(),
  shipment_no: varchar("shipment_no", { length: 20 }).notNull().unique(),
  order_id: varchar("order_id", { length: 10 }).notNull().references(() => orders.id),
  order_no: varchar("order_no", { length: 20 }),
  customer_id: varchar("customer_id", { length: 10 }).notNull().references(() => customers.id),
  customer_name: varchar("customer_name", { length: 100 }),
  ship_date: varchar("ship_date", { length: 20 }).notNull(),
  warehouse_id: varchar("warehouse_id", { length: 10 }).notNull().references(() => warehouses.id),
  warehouse_name: varchar("warehouse_name", { length: 100 }),
  logistics_method: varchar("logistics_method", { length: 50 }),
  tracking_no: varchar("tracking_no", { length: 50 }),
  total_items: integer("total_items").default(0).notNull(),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("shipments_order_id_idx").on(table.order_id),
  index("shipments_customer_id_idx").on(table.customer_id),
]);

// ============ 发货单明细 ============
export const shipment_items = pgTable("shipment_items", {
  id: varchar("id", { length: 10 }).primaryKey(),
  shipment_id: varchar("shipment_id", { length: 10 }).notNull().references(() => shipments.id),
  order_item_id: varchar("order_item_id", { length: 10 }),
  style_no: varchar("style_no", { length: 20 }).notNull(),
  color: varchar("color", { length: 30 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  order_qty: integer("order_qty").notNull(),
  shipped_qty: integer("shipped_qty").notNull(),
  this_ship_qty: integer("this_ship_qty").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  this_ship_amount: numeric("this_ship_amount", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  index("shipment_items_shipment_id_idx").on(table.shipment_id),
]);

// ============ 收款记录 ============
export const payments = pgTable("payments", {
  id: varchar("id", { length: 10 }).primaryKey(),
  payment_no: varchar("payment_no", { length: 20 }).notNull().unique(),
  customer_id: varchar("customer_id", { length: 10 }).notNull().references(() => customers.id),
  customer_name: varchar("customer_name", { length: 100 }),
  payment_date: varchar("payment_date", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 20 }).notNull(),
  related_order_id: varchar("related_order_id", { length: 10 }).references(() => orders.id),
  related_order_no: varchar("related_order_no", { length: 20 }),
  voucher: varchar("voucher", { length: 255 }),
  allocated_amount: numeric("allocated_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  deposit_amount: numeric("deposit_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payments_customer_id_idx").on(table.customer_id),
  index("payments_related_order_id_idx").on(table.related_order_id),
]);

// ============ 工厂付款 ============
export const factory_payments = pgTable("factory_payments", {
  id: varchar("id", { length: 10 }).primaryKey(),
  payment_no: varchar("payment_no", { length: 20 }).notNull().unique(),
  factory_id: varchar("factory_id", { length: 10 }).notNull().references(() => factories.id),
  factory_name: varchar("factory_name", { length: 100 }),
  payment_date: varchar("payment_date", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 20 }).notNull(),
  related_batch_id: varchar("related_batch_id", { length: 10 }).references(() => production_batches.id),
  related_batch_no: varchar("related_batch_no", { length: 20 }),
  voucher: varchar("voucher", { length: 255 }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("factory_payments_factory_id_idx").on(table.factory_id),
  index("factory_payments_related_batch_id_idx").on(table.related_batch_id),
]);

// ============ 库存记录 ============
export const inventory_records = pgTable("inventory_records", {
  id: varchar("id", { length: 10 }).primaryKey(),
  style_no: varchar("style_no", { length: 20 }).notNull(),
  product_name: varchar("product_name", { length: 100 }),
  color: varchar("color", { length: 30 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  warehouse_id: varchar("warehouse_id", { length: 10 }).notNull().references(() => warehouses.id),
  warehouse_name: varchar("warehouse_name", { length: 100 }),
  actual_stock: integer("actual_stock").default(0).notNull(),
  reserved_stock: integer("reserved_stock").default(0).notNull(),
  sellable_stock: integer("sellable_stock").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("正常"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("inventory_records_style_no_idx").on(table.style_no),
  index("inventory_records_warehouse_id_idx").on(table.warehouse_id),
  index("inventory_records_status_idx").on(table.status),
]);

// ============ 库存流水 ============
export const inventory_flows = pgTable("inventory_flows", {
  id: varchar("id", { length: 10 }).primaryKey(),
  date: varchar("date", { length: 20 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  product: varchar("product", { length: 100 }),
  style_no: varchar("style_no", { length: 20 }).notNull(),
  color: varchar("color", { length: 30 }),
  size: varchar("size", { length: 20 }),
  warehouse: varchar("warehouse", { length: 100 }),
  quantity: integer("quantity").notNull(),
  before_stock: integer("before_stock").notNull(),
  after_stock: integer("after_stock").notNull(),
  related_doc: varchar("related_doc", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("inventory_flows_style_no_idx").on(table.style_no),
  index("inventory_flows_type_idx").on(table.type),
  index("inventory_flows_date_idx").on(table.date),
]);

// ============ 客户往来流水 ============
export const customer_ledgers = pgTable("customer_ledgers", {
  id: varchar("id", { length: 10 }).primaryKey(),
  customer_id: varchar("customer_id", { length: 10 }).notNull().references(() => customers.id),
  date: varchar("date", { length: 20 }).notNull(),
  business_type: varchar("business_type", { length: 20 }).notNull(),
  doc_no: varchar("doc_no", { length: 20 }),
  description: varchar("description", { length: 255 }),
  increase_receivable: numeric("increase_receivable", { precision: 12, scale: 2 }).default("0").notNull(),
  received_amount: numeric("received_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  deposit_change: numeric("deposit_change", { precision: 12, scale: 2 }).default("0").notNull(),
  deposit_balance: numeric("deposit_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("customer_ledgers_customer_id_idx").on(table.customer_id),
  index("customer_ledgers_date_idx").on(table.date),
]);
