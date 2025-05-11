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
  PhotoIcon
} from '@heroicons/react/24/outline';
import shopService, { Product, CreateProductData } from '@/services/shopService';
import { Dialog } from '@/components/ui/dialog';
import Image from 'next/image';

export default function ShopPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProductData>();

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => shopService.getProducts().then(res => res.results),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => {
      // Ensure we're properly handling the file upload
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image' && value instanceof FileList) {
            // Handle FileList from input[type=file]
            if (value.length > 0) {
              formData.append(key, value[0]);
            }
          } else if (value instanceof File) {
            // Handle direct File object
            formData.append(key, value);
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (typeof value === 'string') {
            formData.append(key, value);
          }
        }
      });
      
      return shopService.createProduct(data);
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
      
      return shopService.updateProduct({ id, ...productData });
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
        toast.error(error.message || 'Failed to update product');
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

  const onSubmit = (data: CreateProductData) => {
    // Get the file from the input element
    const imageFile = fileInputRef.current?.files?.[0];
    
    // If there's a file, add it to the data
    if (imageFile) {
      data.image = imageFile;
    }
    
    if (editingProduct) {
      updateMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      createMutation.mutate(data);
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

  if (isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBagIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">School Shop</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingProduct(null);
              reset();
              setPreviewUrl(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Product
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new product to the shop.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      <span className="inline-flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
                        Ksh {typeof product.price === 'number' 
                          ? product.price.toFixed(2) 
                          : parseFloat(product.price || '0').toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.stock > 10 
                        ? 'bg-green-100 text-green-800' 
                        : product.stock > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={isOpen}
        onClose={closeModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-6 py-8 shadow-xl transition-all sm:w-full sm:max-w-2xl">
            <div className="absolute right-4 top-4">
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-full bg-blue-50 p-2">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
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
    </div>
  );
} 