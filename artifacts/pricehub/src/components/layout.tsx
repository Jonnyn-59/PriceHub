import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Search,
  BarChart2,
  Package,
  MessageSquare,
  Newspaper,
  CreditCard,
  Settings,
  LogOut,
  Users,
  ShieldAlert,
  Terminal,
  Activity,
  Server,
  Code,
  Tag,
  Menu,
  Bell,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Поиск", href: "/search", icon: Search, roles: ["buyer", "developer", "support"] },
  { title: "Акции", href: "/deals", icon: Tag, roles: ["buyer", "developer", "support"] },
  { title: "Моя экономия", href: "/analytics", icon: TrendingUp, roles: ["buyer", "developer", "support"] },
  { title: "Аналитика", href: "/dashboard", icon: BarChart2, roles: ["seller", "developer", "support"] },
  { title: "Мои товары", href: "/products", icon: Package, roles: ["seller", "developer", "support"] },
  { title: "Сотрудники", href: "/staff", icon: UserPlus, roles: ["seller", "developer", "support"] },
  { title: "Сообщения", href: "/chats", icon: MessageSquare, roles: ["buyer", "seller", "developer", "support"] },
  { title: "Новости", href: "/news", icon: Newspaper, roles: ["buyer", "seller", "developer", "support"] },
  { title: "Подписка", href: "/subscription", icon: CreditCard, roles: ["buyer", "seller", "developer", "support"] },
  { title: "Админ-панель", href: "/admin", icon: ShieldAlert, roles: ["developer", "support"] },
  { title: "Пользователи", href: "/admin/users", icon: Users, roles: ["developer", "support"] },
  { title: "Все товары", href: "/admin/products", icon: Package, roles: ["developer", "support"] },
  { title: "Разработчики", href: "/admin/devs", icon: Code, roles: ["developer"] },
  { title: "Консоль", href: "/admin/console", icon: Terminal, roles: ["developer"] },
  { title: "Аудит", href: "/admin/audit", icon: Activity, roles: ["developer", "support"] },
  { title: "Серверы", href: "/admin/servers", icon: Server, roles: ["developer"] },
  { title: "Код", href: "/admin/code", icon: Code, roles: ["developer"] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const NavLinks = () => (
    <div className="flex flex-col space-y-1">
      {filteredNavItems.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.title}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col bg-card">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/">
            <div className="font-mono font-bold text-xl tracking-tight cursor-pointer text-primary">PriceHub</div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <div className="flex items-center px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
              <Settings className="w-5 h-5 mr-3" />
              <span>Настройки</span>
            </div>
          </Link>
          <div onClick={logout} className="flex items-center px-3 py-2 mt-1 rounded-md text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Выйти</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-card border-r-border">
                <div className="h-16 flex items-center px-6 border-b border-border">
                  <span className="font-mono font-bold text-xl text-primary">PriceHub</span>
                </div>
                <div className="py-4 px-3 overflow-y-auto">
                  <NavLinks />
                  <div className="mt-4 border-t border-border pt-3">
                    <Link href="/settings">
                      <div className="flex items-center px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors">
                        <Settings className="w-5 h-5 mr-3" />
                        <span>Настройки</span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-3 py-2 mt-1 rounded-md text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/">
              <div className="font-mono font-bold text-lg ml-2 cursor-pointer text-primary">PriceHub</div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center">
            {/* Contextual title or breadcrumbs could go here */}
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="hidden sm:inline-flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-none">{user.displayName}</span>
                <span className="text-xs text-muted-foreground capitalize font-mono mt-0.5">{user.role}</span>
              </div>
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
