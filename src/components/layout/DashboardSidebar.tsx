import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Mail, 
  Settings, 
  Bot, 
  BarChart3,
  FileText,
  Shield,
  Building,
  Brain,
  Newspaper,
  Video,
  Activity,
  Lightbulb
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard,
    description: "Overview & Analytics" 
  },
  { 
    title: "Video Chat", 
    url: "/dashboard/video", 
    icon: Video,
    description: "Instant Video Calls" 
  },
  { 
    title: "Analytics", 
    url: "/dashboard/analytics", 
    icon: BarChart3,
    description: "Business Insights" 
  },
  { 
    title: "Content", 
    url: "/dashboard/content", 
    icon: FileText,
    description: "Content Management" 
  },
  { 
    title: "AI Assistant", 
    url: "/dashboard/ai", 
    icon: Bot,
    description: "Jarvis Brain Chat" 
  },
  { 
    title: "JARVIS Control Center", 
    url: "/dashboard/jarvis", 
    icon: Brain,
    description: "Advanced MCP Integration" 
  },
  { 
    title: "Contacts", 
    url: "/dashboard/contacts", 
    icon: Users,
    description: "Contact Management" 
  },
  { 
    title: "CRM", 
    url: "/dashboard/crm", 
    icon: Users,
    description: "Customer Relationship Management" 
  },
  { 
    title: "AI News", 
    url: "/dashboard/news", 
    icon: Newspaper,
    description: "AI Industry News" 
  },
  { 
    title: "Activity Logs", 
    url: "/dashboard/activity-logs", 
    icon: Activity,
    description: "User Activity Monitoring" 
  },
  { 
    title: "WOOC", 
    url: "/dashboard/wooc", 
    icon: Lightbulb,
    description: "Walking Out of Chaos" 
  },
];

const adminItems = [
  { 
    title: "Users", 
    url: "/dashboard/users", 
    icon: Users,
    description: "User Management" 
  },
  { 
    title: "Invitations", 
    url: "/dashboard/invitations", 
    icon: Mail,
    description: "User Invitations" 
  },
  { 
    title: "Messages", 
    url: "/dashboard/messages", 
    icon: MessageSquare,
    description: "Communication Hub" 
  },
  { 
    title: "Settings", 
    url: "/dashboard/settings", 
    icon: Settings,
    description: "System Configuration" 
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-glow" 
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <img 
            src="/jjp-favicon.svg" 
            alt="JJP Solutions" 
            className="h-8 w-8 rounded-lg" 
          />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">JJP Solutions</h1>
              <p className="text-xs text-sidebar-foreground/70">Admin Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {!collapsed && "Main Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    size="lg"
                    isActive={isActive(item.url)}
                  >
                    <NavLink 
                      to={item.url} 
                      title={collapsed ? `${item.title} - ${item.description}` : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {!collapsed && "Administration"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    size="lg"
                    isActive={isActive(item.url)}
                  >
                    <NavLink 
                      to={item.url} 
                      title={collapsed ? `${item.title} - ${item.description}` : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}