import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: File | null;
  stock: number;
}

export const productService = {
  getProducts: async () => {
    try {
      const response = await api.get('/products/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProductById: async (id: string) => {
    try {
      const response = await api.get(`/products/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createProduct: async (data: ProductFormData) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('stock', data.stock.toString());
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await api.post('/products/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProduct: async (id: string, data: Partial<ProductFormData>) => {
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.price) formData.append('price', data.price.toString());
      if (data.stock) formData.append('stock', data.stock.toString());
      if (data.image) formData.append('image', data.image);

      const response = await api.put(`/products/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      await api.delete(`/products/${id}/`);
    } catch (error) {
      throw error;
    }
  },
}; 