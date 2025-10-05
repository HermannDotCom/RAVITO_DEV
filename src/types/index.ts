export type UserRole = 'admin' | 'client' | 'supplier';
export type OrderStatus = 'pending' | 'awaiting-client-validation' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'transferred' | 'completed';
export type PaymentMethod = 'orange' | 'mtn' | 'moov' | 'wave' | 'card';
export type DeliveryMethod = 'truck' | 'tricycle' | 'motorcycle';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  rating: number;
  totalOrders: number;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
  businessName?: string;
  businessHours?: string;
  responsiblePerson?: string;
  coverageZone?: string;
  deliveryCapacity?: DeliveryMethod;
}

export interface Product {
  id: string;
  reference: string;
  name: string;
  category: 'biere' | 'soda' | 'vin' | 'eau' | 'spiritueux';
  brand: string;
  crateType: 'C24' | 'C12' | 'C12V' | 'C6';
  unitPrice: number;
  cratePrice: number;
  consignPrice: number;
  volume: string;
  isActive: boolean;
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
  status: OrderStatus;
  items: any[];
  totalAmount: number;
  consigneTotal: number;
  clientCommission: number;
  supplierCommission: number;
  netSupplierAmount: number;
  deliveryAddress: string;
  coordinates: { lat: number; lng: number };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  estimatedDeliveryTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierOffer {
  supplierId: string;
  supplierName: string;
  estimatedTime: number;
  distance: number;
}
