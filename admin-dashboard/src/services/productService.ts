import api from './api';

// Product interfaces
export interface Product {
  id: string;  // Changed to string since we're using UUID
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
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

// Helper function to create FormData from product data
const createProductFormData = (data: CreateProductData | UpdateProductData): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'string' || typeof value === 'number') {
        formData.append(key, String(value));
      }
    }
  });
  return formData;
};

// Product service functions
const productService = {
  /**
   * Get all products
   */
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/');
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}/`);
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (data: CreateProductData): Promise<Product> => {
    const formData = createProductFormData(data);
    const response = await api.post<Product>('/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update an existing product
   */
  updateProduct: async (data: UpdateProductData): Promise<Product> => {
    const formData = createProductFormData(data);
    const response = await api.patch<Product>(`/products/${data.id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}/`);
  },

  /**
   * Search products by name or description
   */
  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/?search=${query}`);
    return response.data;
  },

  /**
   * Update product stock
   */
  updateStock: async (id: string, stock: number): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}/`, { stock });
    return response.data;
  }
};

export default productService; 