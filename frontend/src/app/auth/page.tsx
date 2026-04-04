// ============================================================
// EduMyles — WorkOS Authentication Page
// ============================================================

'use client';

import React from 'react';
import { WorkOSAuthCard } from '@/components/auth/WorkOSAuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/icons';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-2">
            <Icons.school className="h-8 w-8 text-forest-600" />
            <h1 className="text-3xl font-bold text-forest-900">EduMyles</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            School Management Platform for East Africa
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="secondary">Secure Authentication</Badge>
            <Badge variant="secondary">SSO Ready</Badge>
            <Badge variant="secondary">Multi-tenant</Badge>
          </div>
        </div>

        {/* Authentication Options */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WorkOSAuthCard
                title="Welcome Back"
                description="Sign in to access your EduMyles dashboard"
                redirectTo="/platform"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icons.shield className="h-5 w-5" />
                    <span>Security Features</span>
                  </CardTitle>
                  <CardDescription>
                    Enterprise-grade security for educational institutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Single Sign-On (SSO)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multi-factor Authentication</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Session Management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Role-based Access Control</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Audit Logging</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WorkOSAuthCard
                title="Create Account"
                description="Join the EduMyles platform for your educational institution"
                redirectTo="/auth/pending"
                showMagicLink={true}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icons.users className="h-5 w-5" />
                    <span>Who Can Join?</span>
                  </CardTitle>
                  <CardDescription>
                    EduMyles serves educational institutions across East Africa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Icons.school className="h-4 w-4 text-forest-600" />
                      <span className="text-sm">Schools & Academies</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.graduationCap className="h-4 w-4 text-forest-600" />
                      <span className="text-sm">Universities & Colleges</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.bookOpen className="h-4 w-4 text-forest-600" />
                      <span className="text-sm">Training Centers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icons.award className="h-4 w-4 text-forest-600" />
                      <span className="text-sm">Educational NGOs</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start space-x-2">
                      <Icons.info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Note:</p>
                        <p>All new accounts are subject to verification to ensure platform security and compliance.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icons.lock className="h-3 w-3" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.globe className="h-3 w-3" />
              <span>East African Focus</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.zap className="h-3 w-3" />
              <span>Real-time Updates</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a 
              href="https://workos.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-forest-600 hover:text-forest-700 underline"
            >
              WorkOS
            </a>
            {' '}• Enterprise Authentication Platform
          </p>
        </div>
      </div>
    </div>
  );
}
