import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, FileText, Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">AdCopy AI</h1>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Create high-converting RSA copy for your Google Ads campaigns
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-primary" />
                New RSA Project
              </CardTitle>
              <CardDescription>
                Start generating responsive search ad copy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Create New Project
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Recent Projects
              </CardTitle>
              <CardDescription>
                View and edit your saved projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Projects
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your subscription and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What you can do with AdCopy AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">✨ AI-Powered Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Generate up to 15 headlines and 4 descriptions based on your keywords and campaign theme
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📏 Google Compliant</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically filters content to meet Google's character limits (30 chars for headlines, 90 for descriptions)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">✏️ Inline Editing</h4>
                <p className="text-sm text-muted-foreground">
                  Edit generated copy with real-time character counters and compliance validation
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📊 Google Ads Export</h4>
                <p className="text-sm text-muted-foreground">
                  One-click export to Google Ads Editor compatible CSV format
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary">Free Trial</Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to Pro for unlimited generations and exports
                </p>
              </div>
              <Button>
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;