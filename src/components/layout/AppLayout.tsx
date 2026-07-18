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
  { href: '/create?type=estimate', label: 'Estimates', icon: Wand2 },
  { href: '/create?type=invoice', label: 'Invoices', icon: Wand2 },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, subscription } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isPro = subscription.subscribed;
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside 
        data-tour="sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300 lg:block",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-sidebar-border",
            isCollapsed ? "justify-center px-0" : "justify-between px-6"
          )}>
            {!isCollapsed ? (
              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={logo} alt="HonestInvoice" className="h-8 w-8" />
                <span className="font-display text-lg font-bold text-sidebar-foreground">
                  HonestInvoice
                </span>
              </Link>
            ) : (
              <Link to="/dashboard">
                <img src={logo} alt="HonestInvoice" className="h-8 w-8 hover:opacity-80 transition-opacity" />
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn("hidden lg:flex", isCollapsed && "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md")}
            >
              {isCollapsed ? null : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Status Bar (Sync & Pro) - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-2 bg-muted/20">
              <OfflineIndicator />
              {isPro && (
                <Badge className="gap-1 bg-primary/20 text-primary hover:bg-primary/30 py-0.5 text-[10px] h-5">
                  <Crown className="h-3 w-3" />
                  Pro
                </Badge>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                    isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_2px_8px_hsl(214_70%_50%_/_0.25)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_2px_10px_hsl(214_70%_50%_/_0.2)] hover:translate-x-1'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle and Sign out */}
          <div className="border-t border-sidebar-border p-4 space-y-2">
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between px-3 py-1")}>
              {!isCollapsed && <span className="text-sm text-sidebar-foreground">Theme</span>}
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              title={isCollapsed ? "Sign Out" : undefined}
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center px-0" : "justify-start gap-3"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && "Sign Out"}
            </Button>
            
            {/* Collapse toggle at bottom for easier access */}
             <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full justify-center text-muted-foreground hover:text-foreground mt-2"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : "Collapse Menu"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={logo} alt="HonestInvoice" className="h-8 w-8" />
          <span className="font-display text-lg font-bold">Honest Invoice</span>
        </Link>
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
          style={{ background: 'var(--gradient-mobile-menu)' }}
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
                      ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(214_70%_50%_/_0.25)]'
                      : 'text-foreground hover:bg-accent hover:shadow-[0_2px_10px_hsl(214_70%_50%_/_0.2)]'
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
        className={cn(
          "pt-16 lg:pt-0 transition-all duration-300",
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
        style={{ background: 'var(--gradient-app)' }}
      >
        <div className="relative min-h-screen p-4 lg:p-8">
          <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--gradient-accent-glow)' }} />
          <div className="relative">{children}</div>
        </div>
      </main>
    </div>
  );
}
