export type UserRole = 'client' | 'supplier' | 'admin';

export type ProductCategory = 'biere' | 'soda' | 'vin' | 'eau' | 'spiritueux';
export type CrateType = 'C24' | 'C12' | 'C12V' | 'C6';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  zoneId?: string;
  rating?: number;
  totalOrders?: number;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface Client extends User {
  businessName: string;
  businessHours: string;
  preferredPayments: PaymentMethod[];
  responsiblePerson: string;
}

export interface Supplier extends User {
  businessName: string;
  coverageZone: string;
  availableProducts: string[];
  deliveryCapacity: DeliveryMethod;
  businessHours: string;
  acceptedPayments: PaymentMethod[];
  isAvailable: boolean;
  communes: SupplierCommune[];
}

export interface SupplierCommune {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierBusinessName: string;
  isActive: boolean;
  registeredAt: Date;
  approvedAt?: Date;
  deactivatedAt?: Date;
  deactivationReason?: string;
  reactivatedAt?: Date;
  performanceMetrics: {
    totalOrders: number;
    successRate: number;
    averageDeliveryTime: number;
    lastOrderDate?: Date;
  };
  deliverySettings: {
    maxDeliveryRadius: number;
    minimumOrderAmount: number;
    deliveryFee: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface DeliveryZone {
  id: string;
  communeName: string;
  isActive: boolean;
  suppliers: SupplierCommune[];
  zoneSettings: {
    maxSuppliers: number;
    minimumCoverage: number;
    operatingHours: string;
  };
  statistics: {
    totalSuppliers: number;
    activeSuppliers: number;
    totalOrders: number;
    averageDeliveryTime: number;
    successRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ProductBrand = 'Solibra' | 'Brassivoire';
export type PackagingType = 'C24' | 'C12' | 'C12V';
export type DeliveryMethod = 'truck' | 'tricycle' | 'motorcycle';
export type PaymentMethod = 'orange' | 'mtn' | 'moov' | 'wave' | 'card';

export interface Product {
  id: string;
  reference: string;
  name: string;
  category: ProductCategory;
  brand: string;
  crateType: CrateType;
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  description?: string;
  alcoholContent?: number;
  volume: string;
  isActive: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  withConsigne: boolean;
}

export interface Order {
  id: string;
  clientId: string;
  supplierId?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  consigneTotal: number;
  deliveryAddress: string;
  deliveryZone?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  zoneId?: string;
  paymentMethod: PaymentMethod;
  estimatedDeliveryTime?: number;
  paymentStatus?: PaymentStatus;
  paidAt?: Date;
  transferredAt?: Date;
  createdAt: Date;
  acceptedAt?: Date;
  deliveredAt?: Date;
}

export type OrderStatus =
  | 'pending'
  | 'pending-offers'
  | 'offers-received'
  | 'awaiting-payment'
  | 'paid'
  | 'awaiting-client-validation'
  | 'accepted'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'awaiting-rating'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'transferred' | 'completed';

export interface SupplierPayment {
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  orderCount: number;
  orders: Order[];
  lastOrderDate: Date;
}

export interface Rating {
  id: string;
  orderId: string;
  fromUserId: string;
  toUserId: string;
  fromUserRole: UserRole;
  toUserRole: UserRole;
  punctuality: number;
  quality: number;
  communication: number;
  overall: number;
  comment?: string;
  createdAt: Date;
}

export interface MatchingSupplier {
  supplier: Supplier;
  distance: number;
  estimatedTime: number;
}

// ==================== VIRAL GROWTH ENGINE TYPES ====================

// Referral System
export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  referrerRole: UserRole;
  referredRole: UserRole;
  status: 'pending' | 'converted' | 'completed';
  convertedAt?: Date;
  referrerRewardAmount: number;
  referredRewardAmount: number;
  rewardsDistributedAt?: Date;
  createdAt: Date;
}

export interface ReferralCredit {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  transactionType: 'earned' | 'spent' | 'expired';
  amount: number;
  balanceAfter: number;
  sourceType?: 'referral' | 'bonus' | 'order' | 'vip_upgrade';
  sourceId?: string;
  description?: string;
  createdAt: Date;
}

export interface VIPTier {
  id: string;
  tierName: string;
  tierLevel: number;
  minReferrals: number;
  commissionDiscountPercentage: number;
  priorityMatching: boolean;
  customPricing: boolean;
  boardMembership: boolean;
  description?: string;
  badgeEmoji?: string;
  createdAt: Date;
}

export interface UserVIPStatus {
  id: string;
  userId: string;
  currentTierId?: string;
  tierLevel: number;
  successfulReferrals: number;
  upgradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Gamification System
export interface UserLevel {
  id: string;
  levelName: string;
  levelNumber: number;
  role: UserRole;
  minOrders: number;
  minCompletedOffers: number;
  perks: string[];
  description?: string;
  badgeEmoji?: string;
  createdAt: Date;
}

export interface UserProgression {
  id: string;
  userId: string;
  role: UserRole;
  currentLevel: number;
  totalOrders: number;
  totalCompletedOffers: number;
  levelUpgradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  achievementKey: string;
  name: string;
  description: string;
  badgeEmoji?: string;
  role?: UserRole;
  unlockCriteria: Record<string, any>;
  shareMessage?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  sharedCount: number;
  lastSharedAt?: Date;
}

export interface Leaderboard {
  id: string;
  category: string;
  role?: UserRole;
  periodStart: Date;
  periodEnd: Date;
  rankings: Array<{
    userId: string;
    name: string;
    score: number;
    rank: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Network Effects & Analytics
export interface ZoneNetworkBonus {
  id: string;
  zoneId: string;
  bonusType: 'zone_activation' | 'supplier_density';
  thresholdMet: number;
  bonusPercentage: number;
  activeFrom: Date;
  activeUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierCompetitionPool {
  id: string;
  zoneId: string;
  periodStart: Date;
  periodEnd: Date;
  prizePool: {
    rank_1: number;
    rank_2: number;
    rank_3: number;
  };
  winners?: Array<{
    userId: string;
    rank: number;
    prize: number;
    volume: number;
  }>;
  status: 'active' | 'completed' | 'distributed';
  distributedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceHealthMetrics {
  id: string;
  calculatedAt: Date;
  healthScore: number;
  avgResponseTime: number;
  deliveryReliability: number;
  customerSatisfaction: number;
  activeSuppliers: number;
  activeClients: number;
  totalOrders24h: number;
  bonusTriggered: boolean;
  bonusPercentage: number;
  createdAt: Date;
}

export interface ViralMetrics {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  totalNewUsers: number;
  organicSignups: number;
  referredSignups: number;
  viralCoefficient: number;
  conversionRate: number;
  avgReferralsPerUser: number;
  topReferralChannel?: string;
  channelBreakdown?: Record<string, number>;
  createdAt: Date;
}

export interface GrowthCohort {
  id: string;
  cohortName: string;
  cohortStart: Date;
  cohortEnd: Date;
  initialUsers: number;
  retentionWeek1?: number;
  retentionWeek4?: number;
  retentionWeek12?: number;
  avgOrdersPerUser?: number;
  totalRevenue: number;
  churnRiskUsers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialShare {
  id: string;
  userId: string;
  shareType: 'order_completion' | 'achievement' | 'referral';
  shareChannel: 'whatsapp' | 'instagram' | 'sms';
  contentType?: string;
  contentId?: string;
  clicksReceived: number;
  conversions: number;
  createdAt: Date;
}

export interface LiveActivityFeed {
  id: string;
  activityType: 'order_placed' | 'order_completed' | 'user_joined';
  zoneName?: string;
  anonymizedMessage: string;
  metadata?: Record<string, any>;
  displayUntil: Date;
  createdAt: Date;
}