import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Wand2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Users,
  Crown
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logoLight from '@/assets/honest-invoice-logo.png';
import logoDark from '@/assets/honest-invoice-logo-dark.png';
import { OfflineIndicator } from './OfflineIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Magic Create', icon: Wand2 },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, subscription } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPro = subscription.subscribed;
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar-background lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <img src={logo} alt="HonestInvoice" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              HonestInvoice
            </span>
            {isPro && (
              <Badge className="gap-1 bg-primary/20 text-primary hover:bg-primary/30">
                <Crown className="h-3 w-3" />
                Pro
              </Badge>
            )}
          </div>

          {/* Offline Status */}
          <div className="flex items-center justify-center border-b border-sidebar-border py-2">
            <OfflineIndicator />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_15px_hsl(142_72%_50%_/_0.4)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_20px_hsl(142_72%_50%_/_0.3)] hover:translate-x-1'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle and Sign out */}
          <div className="border-t border-sidebar-border p-4 space-y-2">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm text-sidebar-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <img src={logo} alt="HonestInvoice" className="h-8 w-8" />
          <span className="font-display text-lg font-bold">HonestInvoice</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 pt-16 lg:hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 25% 12%) 50%, hsl(142 72% 20% / 0.3) 100%)'
          }}
        >
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(142_72%_50%_/_0.4)]'
                      : 'text-foreground hover:bg-accent hover:shadow-[0_0_20px_hsl(142_72%_50%_/_0.3)]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 text-base"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main 
        className="pt-16 lg:ml-64 lg:pt-0"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 25% 12%) 50%, hsl(142 72% 20% / 0.3) 100%)'
        }}
      >
        <div className="relative min-h-screen p-4 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_72%_42%_/_0.08),_transparent_50%)]" />
          <div className="relative">{children}</div>
        </div>
      </main>
    </div>
  );
}
