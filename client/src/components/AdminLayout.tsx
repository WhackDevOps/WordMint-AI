import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu, 
  Home,
  User
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-secondary-800">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-secondary-900">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="ml-2 text-white text-lg font-semibold">ContentCraft</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                <Link href="/admin">
                  <a className={`${isActive('/admin') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                    <Home className="mr-3 h-6 w-6" />
                    Dashboard
                  </a>
                </Link>

                <Link href="/admin/orders">
                  <a className={`${isActive('/admin/orders') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                    <BookOpen className="mr-3 h-6 w-6" />
                    Orders
                  </a>
                </Link>

                <Link href="/admin/settings">
                  <a className={`${isActive('/admin/settings') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                    <Settings className="mr-3 h-6 w-6" />
                    Settings
                  </a>
                </Link>

                <div className="pt-4 mt-4 border-t border-secondary-700">
                  <button 
                    onClick={handleLogout}
                    className="text-secondary-300 hover:bg-secondary-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full"
                  >
                    <LogOut className="mr-3 h-6 w-6" />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center md:hidden">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-2 text-primary-600 text-lg font-semibold">ContentCraft</div>
                </div>
                <button 
                  type="button" 
                  className="md:hidden px-4 text-gray-500 focus:outline-none"
                  onClick={toggleMobileMenu}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div>
                    <button 
                      type="button" 
                      className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={toggleUserMenu}
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {user?.username.charAt(0).toUpperCase() || 'A'}
                      </div>
                    </button>
                  </div>
                  <div 
                    className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${userMenuOpen ? '' : 'hidden'}`}
                    role="menu"
                  >
                    <Link href="/profile">
                      <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</a>
                    </Link>
                    <Link href="/admin/settings">
                      <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Settings</a>
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden bg-secondary-800 text-white ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/admin">
              <a className={`${isActive('/admin') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} block px-3 py-2 rounded-md text-base font-medium`}>
                Dashboard
              </a>
            </Link>
            <Link href="/admin/orders">
              <a className={`${isActive('/admin/orders') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} block px-3 py-2 rounded-md text-base font-medium`}>
                Orders
              </a>
            </Link>
            <Link href="/admin/settings">
              <a className={`${isActive('/admin/settings') ? 'bg-secondary-900 text-white' : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'} block px-3 py-2 rounded-md text-base font-medium`}>
                Settings
              </a>
            </Link>
            <button 
              onClick={handleLogout} 
              className="text-secondary-300 hover:bg-secondary-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium border-t border-secondary-700 mt-4 pt-4 w-full text-left"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
