import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MessageSquare, 
  Mail, 
  TrendingUp, 
  Shield, 
  Bot,
  BarChart3,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Messages",
      value: "2,891",
      change: "+8.2%",
      trend: "up",
      icon: MessageSquare,
      color: "text-green-600"
    },
    {
      title: "Contact Forms",
      value: "156",
      change: "+23.1%",
      trend: "up",
      icon: Mail,
      color: "text-orange-600"
    },
    {
      title: "AI Requests",
      value: "4,521",
      change: "+45.7%",
      trend: "up",
      icon: Bot,
      color: "text-purple-600"
    }
  ];

  const recentActivity = [
    {
      type: "user",
      message: "New user registration: john.doe@example.com",
      time: "2 minutes ago",
      status: "success"
    },
    {
      type: "message",
      message: "New partner message from TechCorp Solutions",
      time: "15 minutes ago",
      status: "info"
    },
    {
      type: "contact",
      message: "Contact form submission: Product inquiry",
      time: "32 minutes ago",
      status: "warning"
    },
    {
      type: "ai",
      message: "AI analysis completed: Monthly report generation",
      time: "1 hour ago",
      status: "success"
    },
    {
      type: "security",
      message: "Security scan completed - No threats detected",
      time: "2 hours ago",
      status: "success"
    }
  ];

  const systemHealth = {
    database: 98,
    api: 99,
    email: 97,
    ai: 95
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the JJP Solutions Admin Dashboard. Monitor your business metrics and system performance.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">{stat.change}</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events and user interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-orange-500' :
                    activity.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant={
                    activity.status === 'success' ? 'default' :
                    activity.status === 'warning' ? 'secondary' : 'outline'
                  }>
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Current system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Database</span>
                  <span className="font-medium">{systemHealth.database}%</span>
                </div>
                <Progress value={systemHealth.database} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Services</span>
                  <span className="font-medium">{systemHealth.api}%</span>
                </div>
                <Progress value={systemHealth.api} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Email System</span>
                  <span className="font-medium">{systemHealth.email}%</span>
                </div>
                <Progress value={systemHealth.email} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Services</span>
                  <span className="font-medium">{systemHealth.ai}%</span>
                </div>
                <Progress value={systemHealth.ai} className="h-2" />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Status</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">Add or edit user accounts</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">View Messages</h3>
                  <p className="text-sm text-muted-foreground">Check partner communications</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <Bot className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">Get AI-powered insights</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">View Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate business reports</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}