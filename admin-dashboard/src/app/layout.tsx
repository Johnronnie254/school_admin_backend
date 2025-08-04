'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ConnectivityProvider } from '@/contexts/ConnectivityContext';
import ConnectivityStatus from '@/components/ui/ConnectivityStatus';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ConnectivityProvider>
              <CartProvider>
                <ProtectedRoute>{children}</ProtectedRoute>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      color: '#0f172a',
                      border: '1px solid rgba(226, 232, 240, 0.5)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
                      fontSize: '14px',
                      fontWeight: '500',
                    },
                    success: {
                      style: {
                        background: 'rgba(34, 197, 94, 0.95)',
                        color: '#ffffff',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      },
                      iconTheme: {
                        primary: '#ffffff',
                        secondary: '#22c55e',
                      },
                    },
                    error: {
                      style: {
                        background: 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      },
                      iconTheme: {
                        primary: '#ffffff',
                        secondary: '#ef4444',
                      },
                    },
                    loading: {
                      style: {
                        background: 'rgba(59, 130, 246, 0.95)',
                        color: '#ffffff',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      },
                    },
                  }}
                />
                <ConnectivityStatus />
                <Analytics />
              </CartProvider>
            </ConnectivityProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
