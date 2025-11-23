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
  deliveryConfirmationCode?: string;
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

export type TransferMethod = 'bank_transfer' | 'mobile_money' | 'cash';
export type TransferStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export interface Transfer {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  orderCount: number;
  transferMethod: TransferMethod;
  status: TransferStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferOrder {
  id: string;
  transferId: string;
  orderId: string;
  orderAmount: number;
  createdAt: Date;
}