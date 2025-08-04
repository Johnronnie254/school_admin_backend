import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  BuildingLibraryIcon,
  UserGroupIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Home',
    href: '/superuser',
    icon: HomeIcon,
  },
  {
    name: 'Schools',
    href: '/superuser/schools',
    icon: BuildingLibraryIcon,
  },
  {
    name: 'Users',
    href: '/superuser/users',
    icon: UserGroupIcon,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/superuser') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/superuser/login');
  };

  const NavLinks = () => (
    <>
      <nav className="flex-1 px-3 space-y-2">
        {navigation.map((item, index) => {
          const active = isActive(item.href);
          return (
            <div
              key={item.name}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl
                  transition-all duration-300 ease-out relative overflow-hidden
                  ${active
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-soft border border-blue-200/50'
                    : 'text-gray-900 hover:bg-blue-50 hover:text-blue-900 hover:shadow-soft'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-4 flex-shrink-0 h-5 w-5
                    transition-all duration-300 ease-out
                    ${active
                      ? 'text-blue-600'
                      : 'text-gray-500 group-hover:text-blue-700'
                    }
                  `}
                  aria-hidden="true"
                />
                <span className="font-medium">{item.name}</span>
                {active && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="px-3 mt-6">
        <button
          onClick={handleLogout}
          className="w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:shadow-soft btn-transition"
        >
          <ArrowLeftOnRectangleIcon className="mr-4 flex-shrink-0 h-5 w-5 text-red-500 group-hover:text-red-600 transition-colors duration-300" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 flex items-center justify-between lg:hidden shadow-soft">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src="/Logo.jpg"
              alt="Logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl shadow-soft"
            />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Educite
            </span>
            <p className="text-xs text-gray-500 font-medium">School Management</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl text-gray-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none transition-all duration-200 btn-transition"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex animate-fade-in">
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-20 pb-6 bg-white/95 backdrop-blur-xl shadow-strong animate-slide-in">
            <div className="flex-1 flex flex-col overflow-y-auto px-2">
              <NavLinks />
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200/50 p-6 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                    <span className="text-white font-semibold text-sm">SA</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-secondary-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Super Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 w-72 fixed shadow-soft">
        <div className="flex flex-col h-full w-full">
          <div className="flex-1 flex flex-col pt-8 pb-6">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <div className="relative">
                <Image
                  src="/Logo.jpg"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl shadow-medium"
                />
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Educite
                </span>
                <p className="text-sm text-gray-500 font-medium">School Management System</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <NavLinks />
            </div>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200/50 p-6 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
            <div className="flex items-center space-x-4 w-full">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                  <span className="text-white font-semibold">SA</span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-secondary-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Super Admin</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 