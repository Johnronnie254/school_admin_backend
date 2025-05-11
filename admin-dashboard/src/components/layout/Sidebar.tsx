import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingLibraryIcon,
  UserGroupIcon,
  HomeIcon,
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

  const isActive = (path: string) => {
    if (path === '/superuser') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-full bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="Your Company"
            />
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div>
              <img
                className="inline-block h-9 w-9 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
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
  );
} 