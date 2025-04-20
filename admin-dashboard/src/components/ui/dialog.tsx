'use client';

import { Fragment } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';

export interface DialogProps {
  open: boolean;
  onClose: (value: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className = '' }: DialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className={`relative z-50 ${className}`} onClose={onClose}>
        {children}
      </HeadlessDialog>
    </Transition>
  );
}

Dialog.Panel = HeadlessDialog.Panel;
Dialog.Title = HeadlessDialog.Title;
Dialog.Description = HeadlessDialog.Description;

export default Dialog; 