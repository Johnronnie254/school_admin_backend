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
    
    // Log the raw product data to inspect structure
    if (response.data.results && response.data.results.length > 0) {
      console.log('Raw product data sample:', JSON.stringify(response.data.results[0], null, 2));
      console.log('Product has image property:', response.data.results[0].hasOwnProperty('image'));
      console.log('Image property value:', response.data.results[0].image);
    }
    
    // Process image URLs for all products
    if (response.data.results) {
      response.data.results = response.data.results.map((product: Product) => {
        console.log(`Processing product ${product.id}: ${product.name}`);
        
        if (product.image) {
          const processedUrl = getImageUrl(product.image);
          console.log(`Product ${product.id}: ${product.name} - Original URL: ${product.image} → Processed URL: ${processedUrl}`);
          return { ...product, image: processedUrl };
        } else {
          console.log(`Product ${product.id}: ${product.name} - No image available`);
          return product;
        }
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
    const response = await apiClient.post<Product>('/products/', formData, {
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