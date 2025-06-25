'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  ShoppingBagIcon,
  PlusCircleIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import shopService, { Product, CreateProductData } from '@/services/shopService';
import orderService, { Order } from '@/services/orderService';
import { Dialog } from '@/components/ui/dialog';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { useCart } from '@/contexts/CartContext';
import CartModal from '@/components/modals/CartModal';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to compress images
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions while maintaining aspect ratio
        const maxDimension = 1200; // Max width or height
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            console.log(`Original size: ${file.size / 1024 / 1024} MB, Compressed size: ${blob.size / 1024 / 1024} MB`);
            
            // Create a new file from the blob
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(newFile);
          },
          'image/jpeg',
          0.7 // Quality (0.7 = 70% quality)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
};

export default function ShopPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'products' | 'orders'>('products');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { user } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProductData>();

  // Handle image preview with compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading state
        toast.loading('Processing image...');
        
        // Check file size
        const fileSizeMB = file.size / 1024 / 1024;
        console.log(`Original image size: ${fileSizeMB.toFixed(2)} MB`);
        
        if (fileSizeMB > 10) {
          toast.error('Image is too large. Maximum size is 10MB');
          toast.dismiss();
          return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        toast.dismiss();
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Error processing image');
        toast.dismiss();
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => shopService.getProducts().then(res => res.results),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductData | FormData) => {
      console.log('Creating product with data:', data);
      // Ensure we're properly handling the file upload
      const formData = new FormData();
      
      // If data is already FormData, use it directly
      if (data instanceof FormData) {
        return shopService.createProduct(data);
      }
      
      // Log the file object to see what's coming in
      if (data.image) {
        console.log('Image data type:', typeof data.image);
        console.log('Image is FileList:', data.image instanceof FileList);
        console.log('Image is File:', data.image instanceof File);
      } else {
        console.error('No image data provided in form submission');
      }
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image') {
            if (value instanceof FileList) {
              // Handle FileList from input[type=file]
              if (value.length > 0) {
                console.log('Appending FileList image to FormData:', value[0].name, 'Size:', value[0].size);
                formData.append(key, value[0]);
              } else {
                console.error('FileList is empty');
              }
            } else if (value instanceof File) {
              // Handle direct File object
              console.log('Appending File object to FormData:', value.name);
              formData.append(key, value);
            } else {
              console.error('Image value is not a File or FileList:', value);
            }
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (typeof value === 'string') {
            formData.append(key, value);
          }
        }
      });
      
      // Log the FormData entries to verify what's being sent
      console.log('FormData entries:');
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0], pair[1]);
      });
      
      // Use formData instead of data for the API call
      return shopService.createProduct(formData);
    },
    onSuccess: (data) => {
      console.log('Product created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setIsOpen(false);
      reset();
      setPreviewUrl(null);
    },
    onError: (error: unknown) => {
      console.error('Error creating product:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to create product');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductData & { id: string }) => {
      // Handle file upload for update
      const { id, ...productData } = data;
      
      // Create FormData instance
      const formData = new FormData();
      
      // Get the file from the input element
      const imageFile = fileInputRef.current?.files?.[0];

      // Append all non-image form fields
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'image') {
          if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (typeof value === 'string') {
            formData.append(key, value);
          }
        }
      });

      // Only append image if a new file is selected
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (!imageFile && editingProduct?.image) {
        // If no new image but there's an existing image, send a flag to backend
        formData.append('keep_existing_image', 'true');
      }
      
      return shopService.updateProduct({ id, formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setIsOpen(false);
      setEditingProduct(null);
      reset();
      setPreviewUrl(null);
    },
    onError: (error: unknown) => {
      console.error('Error updating product:', error);
      if (error instanceof Error) {
        const axiosError = error as AxiosError<{ image?: string[] }>;
        const errorMessage = axiosError.response?.data?.image?.[0] || axiosError.message || 'Failed to update product';
        toast.error(errorMessage);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shopService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: unknown) => {
      console.error('Error deleting product:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to delete product');
      }
    }
  });

  const onSubmit = async (data: CreateProductData) => {
    console.log('Form submitted with data:', data);
    
    if (editingProduct) {
      // For updates, don't include image in data if no new file is selected
      const imageFile = fileInputRef.current?.files?.[0];
      if (!imageFile) {
        // Create a new object without the image property
        const restData = {
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock
        };
        updateMutation.mutate({ ...restData, id: editingProduct.id });
      } else {
        try {
          // Compress the image before uploading
          toast.loading('Compressing image...');
          const compressedFile = await compressImage(imageFile);
          toast.dismiss();
          
          // Add the compressed file to the data
          const dataWithFile = { 
            ...data, 
            image: compressedFile 
          };
          console.log('Updating with compressed image:', compressedFile.name, `(${(compressedFile.size / 1024).toFixed(2)} KB)`);
          updateMutation.mutate({ ...dataWithFile, id: editingProduct.id });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast.error('Error compressing image');
        }
      }
    } else {
      // For new products, get the file from the file input ref
      const imageFile = fileInputRef.current?.files?.[0];
      if (!imageFile) {
        console.error('No image file selected');
        toast.error('Please select an image for the product');
        return;
      }
      
      try {
        // Compress the image before uploading
        toast.loading('Compressing image...');
        const compressedFile = await compressImage(imageFile);
        toast.dismiss();
        
        // Create a new FormData instance
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price.toString());
        formData.append('stock', data.stock.toString());
        formData.append('image', compressedFile);
        
        console.log('Creating with compressed image:', compressedFile.name, `(${(compressedFile.size / 1024).toFixed(2)} KB)`);
        createMutation.mutate(formData as unknown as CreateProductData);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('Error compressing image');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Set preview image if product has an image
    if (product.image) {
      setPreviewUrl(product.image);
    } else {
      setPreviewUrl(null);
    }
    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setPreviewUrl(null);
    reset();
  };

  // Fetch orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getOrders().then(res => res.results),
    enabled: user?.role === 'admin'
  });

  // Order processing mutations
  const processOrderMutation = useMutation({
    mutationFn: orderService.processOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as processing');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process order');
    }
  });

  const completeOrderMutation = useMutation({
    mutationFn: orderService.completeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete order');
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: orderService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    }
  });

  if (isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
            <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">School Shop</h1>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsOpen(true);
                }}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add Product
              </button>
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  onClick={() => setSelectedTab('products')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    selectedTab === 'products'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setSelectedTab('orders')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    selectedTab === 'orders'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-l-0 border-gray-300'
                  }`}
                >
                  Orders
                </button>
              </div>
            </>
          )}
          {user?.role === 'parent' && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              View Cart
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedTab === 'products' ? (
        // Products Grid (existing code)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative aspect-square">
                <Image
                  src={product.image || '/placeholder-image.png'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">
                    KES {(typeof product.price === 'number' ? product.price : 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{product.stock} in stock</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {user?.role === 'admin' ? (
                    <>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        addItem(product, 1);
                        toast.success('Added to cart');
                      }}
                      disabled={product.stock === 0}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Orders Section (Admin Only)
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            {isLoadingOrders && (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            )}
          </div>

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.parent_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KES {order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => processOrderMutation.mutate(order.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Process Order"
                              >
                                <ClockIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => cancelOrderMutation.mutate(order.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel Order"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {order.status === 'processing' && (
                            <button
                              onClick={() => completeOrderMutation.mutate(order.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Complete Order"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Order Details #{selectedOrder?.id.slice(-6)}
                </Dialog.Title>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Parent</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedOrder.parent_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order Date</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="mt-1 text-sm text-gray-900">KES {selectedOrder.total_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="border rounded-lg divide-y">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              KES {item.unit_price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            KES {item.total_price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog
        open={isOpen}
        onClose={closeModal}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />

        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-lg px-4 sm:px-6 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
                <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-base sm:text-lg font-semibold leading-6 text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('name', { required: 'Product name is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <textarea
                      rows={3}
                      {...register('description', { required: 'Description is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter product description"
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (Ksh)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { 
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be positive' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      {...register('stock', { 
                        required: 'Stock is required',
                        min: { value: 0, message: 'Stock must be positive' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter stock quantity"
                    />
                    {errors.stock && (
                      <p className="mt-2 text-sm text-red-600">{errors.stock.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="flex items-start space-x-4">
                    {/* Image Preview */}
                    <div className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                      {previewUrl ? (
                        <Image 
                          src={previewUrl} 
                          alt="Product preview" 
                          width={128}
                          height={128}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            console.error('Error loading preview image:', e);
                            e.currentTarget.src = '/placeholder-image.png';
                          }}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <PhotoIcon className="h-10 w-10 text-gray-300 mx-auto" />
                          <p className="text-xs text-gray-500 mt-2">No image</p>
                        </div>
                      )}
                    </div>
                    
                    {/* File Input */}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Select an image file (PNG, JPG, GIF up to 2MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>{editingProduct ? 'Update Product' : 'Create Product'}</>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Cart Modal */}
      {user?.role === 'parent' && (
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </div>
  );
}