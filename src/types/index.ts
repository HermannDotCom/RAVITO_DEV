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
  coverageCommunes: SupplierCommune[];
  availableProducts: string[];
  deliveryCapacity: DeliveryMethod;
  businessHours: string;
  acceptedPayments: PaymentMethod[];
  isAvailable: boolean;
}

export interface SupplierCommune {
  communeId: string;
  communeName: string;
  isActive: boolean;
  maxDeliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  averageDeliveryTime: number;
  totalOrders: number;
  successRate: number;
  lastDelivery?: Date;
  activatedAt: Date;
  deactivatedAt?: Date;
  deactivationReason?: string;
}

export interface Commune {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  isActive: boolean;
  totalSuppliers: number;
  totalOrders: number;
  averageDeliveryTime: number;
  createdAt: Date;
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
  coordinates: {
    lat: number;
    lng: number;
  };
  paymentMethod: PaymentMethod;
  estimatedDeliveryTime?: number;
  paymentStatus?: PaymentStatus;
  paidAt?: Date;
  transferredAt?: Date;
  createdAt: Date;
  acceptedAt?: Date;
  deliveredAt?: Date;
}

export type OrderStatus = 'pending' | 'awaiting-client-validation' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

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