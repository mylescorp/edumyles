"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface ParsedInvite {
  email: string;
  role: string;
  department?: string;
  personalMessage?: string;
  row: number;
  errors: string[];
}

export function BulkInviteUpload() {
  const { sessionToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedInvites, setParsedInvites] = useState<ParsedInvite[]>([]);
  const [defaultRole, setDefaultRole] = useState<string>("");
  const [defaultDepartment, setDefaultDepartment] = useState<string>("");
  const [defaultMessage, setDefaultMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);

  const bulkInviteUsers = useMutation(api.modules.platform.rbac.bulkInvitePlatformUsers);

  const parseCSV = useCallback((text: string): ParsedInvite[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
    const invites: ParsedInvite[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const invite: ParsedInvite = {
        email: "",
        role: "",
        department: "",
        personalMessage: "",
        row: i + 1,
        errors: []
      };

      // Parse each column
      headers.forEach((header, index) => {
        const value = values[index] || "";
        
        switch (header) {
          case 'email':
          case 'e-mail':
            invite.email = value.toLowerCase();
            if (!value || !value.includes('@')) {
              invite.errors.push("Invalid email address");
            }
            break;
          case 'role':
            invite.role = value;
            if (!value) {
              invite.errors.push("Role is required");
            }
            break;
          case 'department':
            invite.department = value;
            break;
          case 'message':
          case 'personal message':
          case 'personal_message':
            invite.personalMessage = value;
            break;
        }
      });

      // Apply defaults if not provided
      if (!invite.role && defaultRole) {
        invite.role = defaultRole;
      }
      if (!invite.department && defaultDepartment) {
        invite.department = defaultDepartment;
      }
      if (!invite.personalMessage && defaultMessage) {
        invite.personalMessage = defaultMessage;
      }

      // Validate required fields
      if (!invite.email) {
        invite.errors.push("Email is required");
      }
      if (!invite.role) {
        invite.errors.push("Role is required");
      }

      invites.push(invite);
    }

    return invites;
  }, [defaultRole, defaultDepartment, defaultMessage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setParsedInvites(parsed);
      
      const validCount = parsed.filter(invite => invite.errors.length === 0).length;
      toast.success(`Parsed ${parsed.length} invitations. ${validCount} are valid.`);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(selectedFile);
  }, [parseCSV]);

  const handleUpload = useCallback(async () => {
    if (!sessionToken || parsedInvites.length === 0) return;

    const validInvites = parsedInvites.filter(invite => invite.errors.length === 0);
    if (validInvites.length === 0) {
      toast.error("No valid invitations to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      const results = await bulkInviteUsers({
        sessionToken,
        invites: validInvites.map(invite => ({
          email: invite.email,
          role: invite.role,
          department: invite.department,
          personalMessage: invite.personalMessage,
        })),
        defaultAddedPermissions: [],
        defaultRemovedPermissions: [],
        defaultScopeCountries: [],
        defaultScopeTenantIds: [],
        defaultScopePlans: [],
        notifyInviter: true,
      });

      setUploadResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      toast.success(`Upload complete: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error("Bulk upload failed:", error);
      toast.error("Failed to upload invitations");
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  }, [sessionToken, parsedInvites, bulkInviteUsers]);

  const downloadTemplate = useCallback(() => {
    const csvContent = `email,role,department,personal_message
john.doe@example.com,support_agent,Support,Welcome to our team!
jane.smith@example.com,billing_admin,Billing,Looking forward to working with you
bob.wilson@example.com,content_moderator,Content,Help us maintain quality`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_invite_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded");
  }, []);

  const validInvites = parsedInvites.filter(invite => invite.errors.length === 0);
  const invalidInvites = parsedInvites.filter(invite => invite.errors.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Invite Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file to invite multiple users at once. Each row should contain email, role, and optional department/message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <h4 className="font-semibold">Need a template?</h4>
              <p className="text-sm text-slate-600">Download our CSV template to get started</p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Default Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="default-role">Default Role</Label>
              <Select value={defaultRole} onValueChange={setDefaultRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_agent">Support Agent</SelectItem>
                  <SelectItem value="billing_admin">Billing Admin</SelectItem>
                  <SelectItem value="content_moderator">Content Moderator</SelectItem>
                  <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default-department">Default Department</Label>
              <Input
                id="default-department"
                value={defaultDepartment}
                onChange={(e) => setDefaultDepartment(e.target.value)}
                placeholder="e.g., Support"
              />
            </div>
            <div>
              <Label htmlFor="default-message">Default Message</Label>
              <Textarea
                id="default-message"
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                placeholder="Welcome to our team!"
                rows={1}
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {/* Parsed Results */}
          {parsedInvites.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {parsedInvites.length} total
                </Badge>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {validInvites.length} valid
                </Badge>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {invalidInvites.length} invalid
                </Badge>
              </div>

              {/* Invalid Entries */}
              {invalidInvites.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Invalid entries found:</p>
                      <ul className="text-sm space-y-1">
                        {invalidInvites.slice(0, 5).map((invite, index) => (
                          <li key={index}>
                            Row {invite.row}: {invite.email} - {invite.errors.join(', ')}
                          </li>
                        ))}
                        {invalidInvites.length > 5 && (
                          <li>... and {invalidInvites.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading invitations...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Upload Results */}
              {uploadResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Upload Results:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={result.success ? "text-green-700" : "text-red-700"}>
                          {result.email}
                        </span>
                        {result.error && (
                          <span className="text-red-500 text-xs">({result.error})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || validInvites.length === 0}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {validInvites.length} Invitations
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
