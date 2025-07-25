import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Shield, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <div className="flex items-center justify-center mb-8">
            <Building className="h-16 w-16 mb-4" />
          </div>
          <h1 className="text-5xl font-bold mb-6">JJP Solutions</h1>
          <p className="text-xl opacity-90 mb-8">Professional Admin Dashboard</p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto mb-12">
            Secure communications, AI-powered insights, and comprehensive business management in one powerful platform.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center text-white">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="opacity-80">Bank-level security for all communications and data</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center text-white">
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Integration</h3>
              <p className="opacity-80">Claude AI assistant for enhanced productivity</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center text-white">
              <Building className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Business Hub</h3>
              <p className="opacity-80">Centralized platform for all business operations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
