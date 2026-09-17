import { pgTable, serial, text, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const settingsTable = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').default('usr_default'),
  propertyName: text('property_name').notNull().default(''),
  landlordName: text('landlord_name').notNull().default(''),
  address: text('address').notNull().default(''),
  electricityRate: real('electricity_rate').notNull().default(0),
  waterRate: real('water_rate').notNull().default(0),
  monthlyWaterPumpFee: real('monthly_water_pump_fee').notNull().default(0),
  fixedPropertyOverhead: real('fixed_property_overhead').notNull().default(0),
  commonAreaMaintenance: real('common_area_maintenance').notNull().default(0),
  monthlyOperatingExpense: real('monthly_operating_expense').notNull().default(0),
  version: text('version').notNull().default('1.0.0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const roomsTable = pgTable('rooms', {
  id: serial('id').primaryKey(),
  userId: text('user_id').default('usr_default'),
  roomId: text('room_id').notNull().unique(),
  roomNumber: text('room_number').notNull(),
  floor: integer('floor').notNull().default(1),
  monthlyRent: real('monthly_rent').notNull().default(0),
  status: text('status').notNull().default('Available'), // Available, Occupied, Maintenance
  tenantName: text('tenant_name'),
  tenantPhone: text('tenant_phone'),
  tenantEmail: text('tenant_email'),
  prevElectricity: real('prev_electricity').default(0),
  currElectricity: real('curr_electricity').default(0),
  prevWater: real('prev_water').default(0),
  currWater: real('curr_water').default(0),
  billed: real('billed').default(0),
  collected: real('collected').default(0),
  balance: real('balance').default(0),
  paymentStatus: text('payment_status').default('Unpaid'), // Paid, Partial, Unpaid
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').default('usr_default'),
  paymentId: text('payment_id').notNull().unique(),
  roomId: text('room_id').notNull(),
  tenantName: text('tenant_name').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  method: text('method').notNull(), // Cash, Bank Transfer, GCash, Check
  notes: text('notes'),
  month: text('month').notNull(), // e.g. "Aug 2026"
  createdAt: timestamp('created_at').defaultNow(),
});

export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: text('user_id').default('usr_default'),
  expenseId: text('expense_id').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(), // Maintenance, Utilities, Repairs, Supplies, Admin, Other
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  month: text('month').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
