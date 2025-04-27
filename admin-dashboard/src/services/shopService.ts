import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: File;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const shopService = {
  // Get all products
  getProducts: async () => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/api/products/');
    return response.data;
  },

  // Get a single product by ID
  getProduct: async (id: string) => {
    const response = await apiClient.get<Product>(`/api/products/${id}/`);
    return response.data;
  },

  // Create a new product
  createProduct: async (data: CreateProductData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      }
    });
    const response = await apiClient.post<Product>('/api/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update an existing product
  updateProduct: async (data: CreateProductData & { id: string }) => {
    const { id, ...productData } = data;
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      }
    });
    const response = await apiClient.put<Product>(`/api/products/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a product
  deleteProduct: async (id: string) => {
    await apiClient.delete(`/api/products/${id}/`);
  },
};

export default shopService; 