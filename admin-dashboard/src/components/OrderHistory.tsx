import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService, { Order } from '@/services/orderService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const statusIcons = {
  pending: <ClockIcon className="h-5 w-5 text-yellow-500" />,
  processing: <ArrowPathIcon className="h-5 w-5 text-blue-500" />,
  completed: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  cancelled: <XCircleIcon className="h-5 w-5 text-red-500" />
};

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20'
};

export default function OrderHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getOrders().then(res => res.results),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    }
  });

  const processOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderService.processOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order is now being processed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process order');
    }
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderService.completeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete order');
    }
  });

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleProcessOrder = (orderId: string) => {
    processOrderMutation.mutate(orderId);
  };

  const handleCompleteOrder = (orderId: string) => {
    completeOrderMutation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order: Order) => (
        <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
          {/* Order header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Order #{order.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusIcons[order.status]}
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset ${statusColors[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="px-6 py-4">
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    KES {item.total_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order footer */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">
              Total: KES {order.total_amount.toFixed(2)}
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' ? (
                <>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleProcessOrder(order.id)}
                      disabled={processOrderMutation.isPending}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Process Order
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={completeOrderMutation.isPending}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      Complete Order
                    </button>
                  )}
                </>
              ) : (
                order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelOrderMutation.isPending}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}