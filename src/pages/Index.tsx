import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">AdCopy AI</h1>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth?tab=signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Generate High-Converting RSA Copy with AI
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create compliant Google Ads Responsive Search Ad copy instantly. 
            Input your keywords and theme, get optimized headlines and descriptions ready for Google Ads Editor.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to="/auth?tab=signup">Start Creating RSAs</Link>
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why AdCopy AI?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>✅ Google Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically filters headlines to ≤30 characters and descriptions to ≤90 characters. 
                No policy violations, ready for Google Ads Editor.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>⚡ AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generates relevant, high-converting ad copy based on your keywords, existing assets, 
                and campaign themes. Smart keyword integration included.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>📊 Editor Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Export directly to Google Ads Editor format. One-click CSV download with proper 
                column mapping for seamless campaign import.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Generate Better RSAs?</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join performance marketers who are creating high-converting ad copy 10x faster with AI.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?tab=signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 AdCopy AI. Built for performance marketers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
