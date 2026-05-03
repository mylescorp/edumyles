"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { emailHelpers } from '@/lib/email';

interface EmailComposerProps {
  className?: string;
}

export function EmailComposer({ className }: EmailComposerProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Custom email state
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    html: '',
    text: '',
  });
  
  // Template email state
  const [templateEmail, setTemplateEmail] = useState<{
    template: 'fee_reminder' | 'exam_results' | 'attendance_alert' | 'payslip' | 'welcome_email' | 'password_reset' | 'general_notification';
    to: string;
    data: Record<string, any>;
  }>({
    template: 'fee_reminder',
    to: '',
    data: {
      // fee_reminder defaults
      amount: 5000,
      dueDate: '2024-03-15',
      studentName: 'John Doe',
      parentName: 'Jane Doe',
      term: 'Term 1',
    },
  });

  const handleSendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject || (!customEmail.html && !customEmail.text)) {
      setResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customEmail),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Email sent successfully!' });
        setCustomEmail({ to: '', subject: '', html: '', text: '' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplateEmail = async () => {
    if (!templateEmail.to) {
      setResult({ success: false, message: 'Please provide recipient email' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateEmail),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Template email sent successfully!' });
        setTemplateEmail({ ...templateEmail, to: '' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send template email' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const updateTemplateData = (key: string, value: any) => {
    setTemplateEmail(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value }
    }));
  };

  const getTemplateFields = () => {
    switch (templateEmail.template) {
      case 'fee_reminder':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={(templateEmail.data as any).amount}
                  onChange={(e) => updateTemplateData('amount', Number(e.target.value))}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={(templateEmail.data as any).dueDate}
                  onChange={(e) => updateTemplateData('dueDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  value={(templateEmail.data as any).studentName}
                  onChange={(e) => updateTemplateData('studentName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  value={(templateEmail.data as any).parentName}
                  onChange={(e) => updateTemplateData('parentName', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="term">Term</Label>
              <Input
                id="term"
                value={(templateEmail.data as any).term}
                onChange={(e) => updateTemplateData('term', e.target.value)}
                placeholder="Term 1"
              />
            </div>
          </>
        );

      case 'exam_results':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="term">Term</Label>
                <Input
                  id="term"
                  value={(templateEmail.data as any).term}
                  onChange={(e) => updateTemplateData('term', e.target.value)}
                  placeholder="Term 1"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={(templateEmail.data as any).year}
                  onChange={(e) => updateTemplateData('year', e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  value={(templateEmail.data as any).studentName}
                  onChange={(e) => updateTemplateData('studentName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  value={(templateEmail.data as any).totalMarks}
                  onChange={(e) => updateTemplateData('totalMarks', Number(e.target.value))}
                  placeholder="450"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={(templateEmail.data as any).grade}
                  onChange={(e) => updateTemplateData('grade', e.target.value)}
                  placeholder="A"
                />
              </div>
              <div>
                <Label htmlFor="position">Position (Optional)</Label>
                <Input
                  id="position"
                  type="number"
                  value={(templateEmail.data as any).position || ''}
                  onChange={(e) => updateTemplateData('position', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1"
                />
              </div>
            </div>
          </>
        );

      default:
        return <p>Template fields will appear here</p>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Composer
        </CardTitle>
        <CardDescription>
          Send custom emails or use predefined templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Email</TabsTrigger>
            <TabsTrigger value="template">Template Email</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label htmlFor="to">Recipient Email</Label>
              <Input
                id="to"
                type="email"
                value={customEmail.to}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={customEmail.subject}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="html">HTML Content</Label>
              <Textarea
                id="html"
                value={customEmail.html}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, html: e.target.value }))}
                placeholder="<p>Email content in HTML format</p>"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="text">Plain Text Content (Optional)</Label>
              <Textarea
                id="text"
                value={customEmail.text}
                onChange={(e) => setCustomEmail(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Plain text version of your email"
                rows={4}
              />
            </div>
            <Button onClick={handleSendCustomEmail} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div>
              <Label htmlFor="template-select">Email Template</Label>
              <Select
                value={templateEmail.template}
                onValueChange={(value: any) => {
                  const newData = value === 'fee_reminder' ? {
                    amount: 5000,
                    dueDate: '2024-03-15',
                    studentName: 'John Doe',
                    parentName: 'Jane Doe',
                    term: 'Term 1',
                  } : value === 'exam_results' ? {
                    term: 'Term 1',
                    year: '2024',
                    studentName: 'John Doe',
                    totalMarks: 450,
                    grade: 'A',
                  } : value === 'attendance_alert' ? {
                    studentName: 'John Doe',
                    date: '2024-03-15',
                    subjects: ['Math', 'English'],
                  } : value === 'payslip' ? {
                    period: 'March 2024',
                    basicSalary: 50000,
                    allowances: 5000,
                    deductions: 8000,
                    netPay: 47000,
                    employeeName: 'John Doe',
                  } : value === 'welcome_email' ? {
                    name: 'John Doe',
                    role: 'Teacher',
                    schoolName: 'EduMyles School',
                    loginUrl: 'https://app.edumyles.com/auth/login',
                  } : value === 'password_reset' ? {
                    name: 'John Doe',
                    resetUrl: 'https://app.edumyles.com/auth/password-reset',
                    expiryHours: 24,
                  } : value === 'general_notification' ? {
                    title: 'School Holiday',
                    message: 'School will be closed for holidays from next week.',
                    actionUrl: 'https://app.edumyles.com',
                    actionText: 'View Calendar',
                  } : {};
                  
                  setTemplateEmail({
                    template: value,
                    to: templateEmail.to,
                    data: newData,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                  <SelectItem value="exam_results">Exam Results</SelectItem>
                  <SelectItem value="attendance_alert">Attendance Alert</SelectItem>
                  <SelectItem value="payslip">Payslip</SelectItem>
                  <SelectItem value="welcome_email">Welcome Email</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="general_notification">General Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-to">Recipient Email</Label>
              <Input
                id="template-to"
                type="email"
                value={templateEmail.to}
                onChange={(e) => setTemplateEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@example.com"
              />
            </div>

            <div className="space-y-4">
              <Label>Template Data</Label>
              {getTemplateFields()}
            </div>

            <Button onClick={handleSendTemplateEmail} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Template...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Template Email
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
            result.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
