import { useState, useEffect } from 'react';
import { useRoute, Link } from '@/lib/router';
import { Logo } from './ui/Logo';
import { Search, LayoutDashboard, Inbox, Users, Brain, Home, Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workspace', label: 'Workspace', icon: Inbox },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/memory', label: 'Memory', icon: Brain },
];

export function Nav() {
  const route = useRoute();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileOpen(false);
  }, [route.path]);

  const isActive = (path: string) => {
    if (path === '/') return route.path === '/';
    return route.path.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/">
                <Logo size="sm" />
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/search"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-all border border-ink-200"
              >
                <Search size={16} />
                <span>Search...</span>
                <kbd className="ml-2 text-xs bg-ink-100 px-1.5 py-0.5 rounded text-ink-400">⌘K</kbd>
              </Link>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-ink-50"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-ink-200 bg-white">
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
