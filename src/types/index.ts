import { Role, TableStatus, OrderStatus, ItemStatus, Station, PaymentMethod, DiscountType } from "@prisma/client";

export type { Role, TableStatus, OrderStatus, ItemStatus, Station, PaymentMethod, DiscountType };

export interface TableWithOrder {
  id: string;
  number: number | null;
  customName: string | null;
  status: TableStatus;
  isActive: boolean;
  activeOrderId?: string | null;
}

export interface OrderItemWithMenu {
  id: string;
  roundId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: ItemStatus;
  menuItem: {
    id: string;
    name: string;
    price: number;
    category: {
      id: string;
      name: string;
      station: Station;
    };
  };
  voidLog?: {
    reason: string;
    voidedAt: Date;
  } | null;
}

export interface OrderRoundWithItems {
  id: string;
  orderId: string;
  roundNumber: number;
  createdAt: Date;
  items: OrderItemWithMenu[];
}

export interface OrderWithDetails {
  id: string;
  restaurantId: string;
  tableId: string;
  shiftId: string;
  status: OrderStatus;
  createdAt: Date;
  table: {
    id: string;
    number: number | null;
    customName: string | null;
  };
  rounds: OrderRoundWithItems[];
}

export interface KDSItem {
  orderId: string;
  tableLabel: string;
  roundNumber: number;
  roundId: string;
  items: OrderItemWithMenu[];
  createdAt: Date;
}

export interface CheckoutSummary {
  subtotal: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
  items: OrderItemWithMenu[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  station: Station;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
