import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  stock: number;
  created_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: File;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
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
  getProducts: () => api.get<Product[]>('/api/products/'),

  // Get a single product by ID
  getProduct: (id: string) => api.get<Product>(`/api/products/${id}/`),

  // Create a new product
  createProduct: (data: CreateProductData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('stock', data.stock.toString());
    if (data.image) {
      formData.append('image', data.image);
    }
    return api.post<Product>('/api/products/', formData);
  },

  // Update an existing product
  updateProduct: ({ id, ...data }: CreateProductData & { id: string }) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('stock', data.stock.toString());
    if (data.image) {
      formData.append('image', data.image);
    }
    return api.put<Product>(`/api/products/${id}/`, formData);
  },

  // Delete a product
  deleteProduct: (id: string) => api.delete(`/api/products/${id}/`),
};

export default shopService; 