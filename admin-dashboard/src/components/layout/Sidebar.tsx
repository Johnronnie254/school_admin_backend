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
      <nav className="flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                transition-all duration-200 ease-in-out relative
                ${active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 flex-shrink-0 h-6 w-6
                  transition-colors duration-200 ease-in-out
                  ${active
                    ? 'text-blue-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
                aria-hidden="true"
              />
              {item.name}
              {active && (
                <div className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-r-md" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 mt-2">
        <button
          onClick={handleLogout}
          className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <ArrowLeftOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-red-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between lg:hidden">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="ml-2 text-lg font-semibold text-gray-900">Educite</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
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
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-16 pb-4 bg-white">
            <div className="flex-1 flex flex-col overflow-y-auto">
              <NavLinks />
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div>
                  <Image
                    src="/user-avatar.png"
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Super Admin</p>
                  <p className="text-xs font-medium text-gray-500">View profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full bg-white border-r border-gray-200 w-64 fixed">
        <div className="flex flex-col h-full w-full">
          <div className="flex-1 flex flex-col pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">Educite</span>
            </div>
            <div className="mt-8 flex-1 flex flex-col justify-between">
              <NavLinks />
            </div>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <Image
                  src="/user-avatar.png"
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Super Admin</p>
                <p className="text-xs font-medium text-gray-500">View profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 