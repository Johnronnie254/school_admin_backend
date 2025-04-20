'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthProvider } from '@/contexts/AuthContext';

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
            <ProtectedRoute>{children}</ProtectedRoute>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#22c55e',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
