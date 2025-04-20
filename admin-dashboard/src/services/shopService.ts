import axios from 'axios';

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
  getProducts: () => axios.get<Product[]>('/api/products'),

  // Get a single product by ID
  getProduct: (id: string) => {
    return axios.get<Product>(`/api/products/${id}/`);
  },

  // Create a new product
  createProduct: (data: CreateProductData) => {
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
    return axios.post<Product>('/api/products', formData);
  },

  // Update an existing product
  updateProduct: (data: CreateProductData & { id: string }) => {
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
    return axios.put<Product>(`/api/products/${id}`, formData);
  },

  // Delete a product
  deleteProduct: (id: string) => axios.delete<void>(`/api/products/${id}`),
};

export default shopService; 