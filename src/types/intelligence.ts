/**
 * TypeScript types for Supplier Intelligence Dashboard
 * 
 * These types represent the database schema for the analytics and intelligence features.
 */

// =============================================
// SUBSCRIPTION TYPES
// =============================================

export type SubscriptionTierName = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended';

export interface SubscriptionTier {
  id: string;
  tierName: SubscriptionTierName;
  monthlyPrice: number; // FCFA
  features: string[];
  limits: {
    reports?: number | 'unlimited';
    api_calls?: number | 'unlimited';
    data_retention_days?: number | 'unlimited';
    support?: string;
    dedicated_manager?: boolean;
    api_access?: boolean;
  };
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierSubscription {
  id: string;
  supplierId: string;
  tierId: string;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentAt?: Date;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// ANALYTICS TYPES
// =============================================

export interface SupplierAnalytics {
  id: string;
  supplierId: string;
  date: Date;
  
  // Order Metrics
  totalOrders: number;
  acceptedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  acceptanceRate?: number; // Percentage
  
  // Revenue Metrics
  grossRevenue: number; // FCFA
  netRevenue: number; // After commissions
  averageOrderValue: number;
  
  // Performance Metrics
  averageDeliveryTime?: number; // Minutes
  onTimeDeliveryRate?: number; // Percentage
  customerSatisfaction?: number; // Average rating 1-5
  
  // Customer Metrics
  uniqueCustomers: number;
  repeatCustomers: number;
  newCustomers: number;
  churnCustomers: number;
  
  // Zone Coverage
  zonesServed: string[];
  primaryZone?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// DEMAND FORECASTING TYPES
// =============================================

export type DemandIntensity = 'low' | 'medium' | 'high' | 'very_high';

export interface DemandForecast {
  id: string;
  zoneId?: string;
  productCategory: string;
  forecastDate: Date;
  forecastHour?: number; // 0-23
  
  // Forecast Data
  predictedDemand: number;
  confidenceLevel?: number; // 0-1
  demandIntensity?: DemandIntensity;
  
  // Factors
  seasonalityFactor?: number;
  weatherFactor?: number;
  eventFactor?: number;
  historicalAverage?: number;
  
  // Recommendations
  suggestedStockLevel?: number;
  suggestedPricingAdjustment?: number; // Percentage
  
  modelVersion?: string;
  createdAt: Date;
}

// =============================================
// MARKET INTELLIGENCE TYPES
// =============================================

export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'special';

export interface TrendingProduct {
  productId: string;
  productName: string;
  growthRate: number;
  volumeIncrease: number;
}

export interface MarketIntelligence {
  id: string;
  reportType: ReportType;
  title: string;
  reportDate: Date;
  zoneId?: string;
  
  // Market Data
  totalMarketVolume?: number;
  totalMarketValue?: number;
  growthRate?: number;
  
  // Trends
  trendingProducts: TrendingProduct[];
  decliningProducts: TrendingProduct[];
  emergingZones: Array<{
    zoneId: string;
    zoneName: string;
    growthRate: number;
  }>;
  
  // Insights
  keyInsights: string[];
  recommendations: string[];
  
  // Heatmap Data
  demandHeatmap: Record<string, number>;
  
  reportUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// COMPETITOR BENCHMARKING TYPES
// =============================================

export type BenchmarkCategory = 'overall' | 'by_zone' | 'by_product_category';

export interface CompetitorBenchmark {
  id: string;
  zoneId?: string;
  periodStart: Date;
  periodEnd: Date;
  category: BenchmarkCategory;
  
  // Performance Metrics (Anonymized)
  avgDeliveryTime?: number;
  avgAcceptanceRate?: number;
  avgCustomerRating?: number;
  avgOrderValue?: number;
  
  // Percentile Data
  top10PercentMetrics: {
    deliveryTime?: number;
    acceptanceRate?: number;
    customerRating?: number;
    revenue?: number;
  };
  top25PercentMetrics: {
    deliveryTime?: number;
    acceptanceRate?: number;
    customerRating?: number;
    revenue?: number;
  };
  medianMetrics: {
    deliveryTime?: number;
    acceptanceRate?: number;
    customerRating?: number;
    revenue?: number;
  };
  
  totalSuppliersInBenchmark?: number;
  createdAt: Date;
}

export interface SupplierBenchmarkComparison {
  supplierMetrics: {
    deliveryTime: number;
    acceptanceRate: number;
    customerRating: number;
    revenue: number;
  };
  benchmark: CompetitorBenchmark;
  percentileRanking: {
    deliveryTime: number; // 0-100
    acceptanceRate: number;
    customerRating: number;
    revenue: number;
  };
  recommendations: string[];
}

// =============================================
// PRICE OPTIMIZATION TYPES
// =============================================

export type OptimizationType = 'increase_revenue' | 'increase_volume' | 'competitive' | 'seasonal';

export interface PriceOptimizationSuggestion {
  id: string;
  supplierId: string;
  productId?: string;
  
  // Current State
  currentPrice: number;
  currentDemand: number;
  
  // Suggestions
  suggestedPrice: number;
  expectedDemandChange?: number; // Percentage
  expectedRevenueImpact?: number; // FCFA
  
  // Reasoning
  optimizationType?: OptimizationType;
  demandElasticity?: number;
  confidenceScore?: number; // 0-1
  reasoning?: string;
  
  // Validity
  validFrom: Date;
  validUntil?: Date;
  isApplied: boolean;
  appliedAt?: Date;
  
  createdAt: Date;
}

// =============================================
// CHURN RISK TYPES
// =============================================

export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ChurnRiskFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface RetentionAction {
  action: string;
  priority: number;
  expectedImpact: string;
}

export interface ChurnRiskPrediction {
  id: string;
  supplierId: string;
  customerId: string;
  
  // Risk Assessment
  churnRiskScore: number; // 0-1
  riskLevel: ChurnRiskLevel;
  
  // Contributing Factors
  factors: ChurnRiskFactor[];
  
  // Recommendations
  retentionActions: RetentionAction[];
  estimatedLifetimeValue?: number; // FCFA
  
  // Predictions
  predictedChurnDate?: Date;
  confidenceLevel?: number;
  
  // Status
  isChurned: boolean;
  churnedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// WHITE LABEL API TYPES
// =============================================

export interface WhiteLabelApiKey {
  id: string;
  partnerName: string;
  apiKey: string;
  apiSecret: string;
  
  // Access Control
  isActive: boolean;
  allowedEndpoints: string[];
  rateLimit: number; // Requests per hour
  
  // Business Terms
  revenueSharePercentage: number;
  
  // Usage Tracking
  totalRequests: number;
  totalTransactions: number;
  totalRevenue: number;
  
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'order' | 'subscription' | 'service';
export type SettlementStatus = 'pending' | 'processed' | 'paid';

export interface RevenueShareTracking {
  id: string;
  apiKeyId: string;
  orderId?: string;
  
  // Transaction Details
  transactionType: TransactionType;
  grossAmount: number;
  platformShare: number;
  partnerShare: number;
  
  // Settlement
  settlementStatus: SettlementStatus;
  settledAt?: Date;
  
  createdAt: Date;
}

// =============================================
// DASHBOARD VIEW MODELS
// =============================================

export interface SupplierDashboardData {
  subscription: SupplierSubscription & { tier: SubscriptionTier };
  analytics: SupplierAnalytics;
  kpis: {
    acceptanceRate: number;
    avgDeliveryTime: number;
    customerRating: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    customerRetention: number;
  };
  demandForecasts?: DemandForecast[];
  priceOptimizations?: PriceOptimizationSuggestion[];
  churnRisks?: ChurnRiskPrediction[];
  benchmarkComparison?: SupplierBenchmarkComparison;
  revenueOpportunity?: {
    currentMonthlyRevenue: number;
    potentialMonthlyRevenue: number;
    gapToTop10Percent: number;
    actionItems: string[];
  };
}

export interface MarketIntelligenceReport {
  intelligence: MarketIntelligence;
  heatmapData: Array<{
    zone: string;
    demand: number;
    growth: number;
    opportunity: number;
  }>;
  topProducts: TrendingProduct[];
  untappedZones: Array<{
    zoneId: string;
    zoneName: string;
    potentialRevenue: number;
    competitionLevel: 'low' | 'medium' | 'high';
  }>;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface AnalyticsFilterParams {
  startDate?: Date;
  endDate?: Date;
  zoneId?: string;
  category?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export interface SubscriptionUpgradeRequest {
  tierName: SubscriptionTierName;
  paymentMethod: string;
  autoRenew?: boolean;
}

export interface PriceOptimizationRequest {
  productId?: string;
  category?: string;
  targetMetric: 'revenue' | 'volume' | 'profit';
}

export interface DemandForecastRequest {
  zoneId?: string;
  category?: string;
  forecastDays: number;
  includeHourly?: boolean;
}
