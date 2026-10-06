import { z } from "zod";

export const BusinessType = z.enum(["B2G", "B2B", "B2C"]);
export type BusinessType = z.infer<typeof BusinessType>;

export const NewsCategory = z.enum([
  "CONTRACT",
  "CANCELLATION",
  "ACHIEVEMENT",
  "EARNINGS",
  "OTHER",
]);
export type NewsCategory = z.infer<typeof NewsCategory>;

export const NewsOrigin = z.enum(["AUTO", "MANUAL"]);
export type NewsOrigin = z.infer<typeof NewsOrigin>;

export const Directionality = z.enum(["directed", "undirected"]);
export type Directionality = z.infer<typeof Directionality>;

// ---------- Stock ----------
export const StockSchema = z.object({
  id: z.number().int(),
  ticker: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  businessSummary: z.string().nullable().optional(),
  riskNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  posX: z.number().nullable().optional(),
  posY: z.number().nullable().optional(),
  layoutPinned: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Stock = z.infer<typeof StockSchema>;

export const StockInputSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  businessSummary: z.string().nullable().optional(),
  riskNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type StockInput = z.infer<typeof StockInputSchema>;

// ---------- Stock Links ----------
export const StockLinkSchema = z.object({
  id: z.number().int(),
  stockId: z.number().int(),
  label: z.string().min(1),
  url: z.string().url(),
  createdAt: z.string().optional(),
});
export type StockLink = z.infer<typeof StockLinkSchema>;

export const StockLinkInputSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});
export type StockLinkInput = z.infer<typeof StockLinkInputSchema>;

// ---------- Relation Types ----------
export const RelationTypeSchema = z.object({
  id: z.number().int(),
  code: z.string().min(1),
  labelKo: z.string().min(1),
  color: z.string().min(1),
  directionality: Directionality,
});
export type RelationTypeDef = z.infer<typeof RelationTypeSchema>;

// ---------- Products ----------
export const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

export const StockProductSchema = z.object({
  stockId: z.number().int(),
  productId: z.number().int(),
  productName: z.string().optional(),
  businessType: BusinessType,
  isCore: z.boolean(),
  revenueShare: z.number().nullable().optional(),
});
export type StockProduct = z.infer<typeof StockProductSchema>;

export const StockProductInputSchema = z.object({
  productId: z.number().int().optional(),
  productName: z.string().min(1).optional(),
  businessType: BusinessType,
  isCore: z.boolean().default(true),
  revenueShare: z.number().nullable().optional(),
});
export type StockProductInput = z.infer<typeof StockProductInputSchema>;

// ---------- Themes ----------
export const ThemeSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  color: z.string().nullable().optional(),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const ThemeInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional(),
});
export type ThemeInput = z.infer<typeof ThemeInputSchema>;

// ---------- Relations ----------
export const RelationSchema = z.object({
  id: z.number().int(),
  sourceStockId: z.number().int(),
  targetStockId: z.number().int(),
  relationTypeId: z.number().int(),
  productId: z.number().int().nullable().optional(),
  revenueDependencyPct: z.number().nullable().optional(),
  weight: z.number(),
  description: z.string().nullable().optional(),
  lastConfirmedAt: z.string().nullable().optional(),
});
export type Relation = z.infer<typeof RelationSchema>;

export const RelationInputSchema = z.object({
  sourceStockId: z.number().int(),
  targetStockId: z.number().int(),
  relationTypeId: z.number().int(),
  productId: z.number().int().nullable().optional(),
  revenueDependencyPct: z.number().nullable().optional(),
  weight: z.number().default(1),
  description: z.string().nullable().optional(),
  lastConfirmedAt: z.string().nullable().optional(),
});
export type RelationInput = z.infer<typeof RelationInputSchema>;

// ---------- News ----------
export const NewsSchema = z.object({
  id: z.number().int(),
  stockId: z.number().int(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  category: NewsCategory,
  origin: NewsOrigin,
  isConfirmed: z.boolean(),
  collectedAt: z.string().optional(),
});
export type News = z.infer<typeof NewsSchema>;

export const NewsInputSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  category: NewsCategory.default("OTHER"),
});
export type NewsInput = z.infer<typeof NewsInputSchema>;

// ---------- Graph payload ----------
export const GraphNodeSchema = z.object({
  id: z.number().int(),
  ticker: z.string(),
  name: z.string(),
  sector: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  x: z.number(),
  y: z.number(),
  degree: z.number().int(),
  themeIds: z.array(z.number().int()),
  businessTypes: z.array(BusinessType),
  latestNewsCategory: NewsCategory.nullable().optional(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  id: z.number().int(),
  source: z.number().int(),
  target: z.number().int(),
  relationTypeId: z.number().int(),
  productId: z.number().int().nullable().optional(),
  productName: z.string().nullable().optional(),
  revenueDependencyPct: z.number().nullable().optional(),
  weight: z.number(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export const GraphPayloadSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  relationTypes: z.array(RelationTypeSchema),
  themes: z.array(ThemeSchema),
});
export type GraphPayload = z.infer<typeof GraphPayloadSchema>;

export const LayoutPositionSchema = z.object({
  stockId: z.number().int(),
  x: z.number(),
  y: z.number(),
});
export type LayoutPosition = z.infer<typeof LayoutPositionSchema>;
