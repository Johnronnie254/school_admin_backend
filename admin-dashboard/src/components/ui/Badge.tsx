'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-600 text-primary-50 hover:bg-primary-700',
        secondary: 'border-transparent bg-secondary-600 text-secondary-50 hover:bg-secondary-700',
        destructive: 'border-transparent bg-red-600 text-red-50 hover:bg-red-700',
        success: 'border-transparent bg-secondary-500 text-white hover:bg-secondary-600',
        warning: 'border-transparent bg-warning-500 text-white hover:bg-warning-600',
        outline: 'text-surface-700 border-surface-300 bg-white/80 backdrop-blur-sm',
        ghost: 'text-surface-700 bg-surface-100 hover:bg-surface-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
