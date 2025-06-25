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
  image?: File | string;
}

export interface UpdateProductData {
  id: string;
  formData: FormData;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Helper function to get proper image URL
export const getImageUrl = (imageUrl: string | null): string => {
  if (!imageUrl) {
    console.log('No image URL provided');
    return '/placeholder-image.png';
  }
  
  console.log('Original image URL:', imageUrl);
  
  // Check if the URL is already absolute
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('Using absolute image URL:', imageUrl);
    return imageUrl;
  }
  
  // Check if the URL is a data URL
  if (imageUrl.startsWith('data:')) {
    console.log('Using data URL for image');
    return imageUrl;
  }
  
  // Handle relative URLs by prepending the API base URL
  // Remove any leading slashes from the imageUrl
  const cleanImagePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  
  // Construct the full URL
  const baseUrl = 'https://www.educitebackend.co.ke';
  const fullUrl = `${baseUrl}/${cleanImagePath}`;
  
  console.log('Constructed full image URL:', fullUrl);
  return fullUrl;
};

const shopService = {
  // Get all products
  getProducts: async () => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products/');
    console.log('Products API response:', response.data);
    
    // Process and validate products
    if (response.data.results) {
      response.data.results = response.data.results.map((product: Product) => {
        // Validate and convert price to number
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        if (isNaN(price)) {
          console.warn(`Product ${product.id} (${product.name}) has invalid price:`, product.price);
          return { ...product, price: 0 };
        }
        
        // Process image URL
        if (product.image) {
          const processedUrl = getImageUrl(product.image);
          return { ...product, price, image: processedUrl };
        }
        
        return { ...product, price };
      });
    }
    
    return response.data;
  },

  // Get a single product by ID
  getProduct: async (id: string) => {
    const response = await apiClient.get<Product>(`/products/${id}/`);
    
    // Process image URL
    if (response.data.image) {
      response.data.image = getImageUrl(response.data.image);
    }
    
    return response.data;
  },

  // Create a new product
  createProduct: async (data: CreateProductData | FormData) => {
    console.log('ShopService: Creating product with data type:', data instanceof FormData ? 'FormData' : 'CreateProductData');
    
    let formData: FormData;
    
    // If data is not already FormData, create a new FormData instance
    if (!(data instanceof FormData)) {
      formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof File) {
            console.log('Converting File to FormData:', key, value.name);
            formData.append(key, value);
          } else if (value instanceof FileList && value.length > 0) {
            console.log('Converting FileList to FormData:', key, value[0].name);
            formData.append(key, value[0]);
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (typeof value === 'string') {
            formData.append(key, value);
          }
        }
      });
    } else {
      formData = data;
    }
    
    try {
      const response = await apiClient.post<Product>('/products/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('API Response:', response);
      
      // Process image URL in the response
      if (response.data.image) {
        response.data.image = getImageUrl(response.data.image);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product
  updateProduct: async ({ id, formData }: UpdateProductData) => {
    const response = await apiClient.put<Product>(`/products/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Process image URL in the response
    if (response.data.image) {
      response.data.image = getImageUrl(response.data.image);
    }
    
    return response.data;
  },

  // Delete a product
  deleteProduct: async (id: string) => {
    await apiClient.delete(`/products/${id}/`);
  },
};

export default shopService; 