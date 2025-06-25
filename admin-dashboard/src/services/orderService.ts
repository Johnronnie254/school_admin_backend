import { apiClient } from '@/lib/api';

export interface OrderItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  parent: string;
  parent_name: string;
  school: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  school: string;
  items: {
    product: string;
    quantity: number;
  }[];
}

const orderService = {
  // Get all orders for the current user
  getOrders: async () => {
    const response = await apiClient.get<{ results: Order[] }>('/orders/');
    return response.data;
  },

  // Get a specific order
  getOrder: async (id: string) => {
    const response = await apiClient.get<Order>(`/orders/${id}/`);
    return response.data;
  },

  // Create a new order
  createOrder: async (data: CreateOrderData) => {
    const response = await apiClient.post<Order>('/orders/', data);
    return response.data;
  },

  // Cancel an order
  cancelOrder: async (id: string) => {
    const response = await apiClient.post<{ detail: string }>(`/orders/${id}/cancel/`);
    return response.data;
  },

  // Process an order (admin only)
  processOrder: async (id: string) => {
    const response = await apiClient.post<{ detail: string }>(`/orders/${id}/process/`);
    return response.data;
  },

  // Complete an order (admin only)
  completeOrder: async (id: string) => {
    const response = await apiClient.post<{ detail: string }>(`/orders/${id}/complete/`);
    return response.data;
  }
};

export default orderService; 