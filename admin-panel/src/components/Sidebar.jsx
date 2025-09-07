import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Users,
  X,
  Settings,
  User2, // or Truck/SteeringWheel icon
  Truck,
  FileText,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Drivers", href: "/drivers", icon: User2 }, // or Truck/SteeringWheel icon
  { name: "Vehicles", href: "/vehicles", icon: Truck },
  { name: "Consignments", href: "/consignments", icon: Package },
  { name: "Load Chalans", href: "/load-chalans", icon: ClipboardList },
  { name: "Freight Bills", href: "/freight-bills", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
  // { name: "Users", href: "/users", icon: UserCog }, // Optional
];

const Sidebar = ({ isOpen, isCollapsed, onClose, className }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-border transition-all duration-300",
            isCollapsed ? "justify-center p-4" : "justify-between p-6"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  G
                </span>
              </div>
              <span className="font-semibold text-lg">KVL Logistics Admin</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                G
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn("lg:hidden", isCollapsed && "hidden")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 transition-all duration-300",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center transition-colors rounded-lg text-sm font-medium",
                      isCollapsed
                        ? "justify-center p-3"
                        : "space-x-3 px-3 py-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )
                  }
                  onClick={onClose}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-border transition-all duration-300",
            isCollapsed ? "p-2" : "p-4"
          )}
        >
          {!isCollapsed && <Separator className="mb-4" />}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center transition-colors rounded-lg text-sm font-medium",
                isCollapsed ? "justify-center p-3" : "space-x-3 px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )
            }
            onClick={onClose}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
