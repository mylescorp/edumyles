"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download,
  Send,
  Signature,
  Eye,
  Edit,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  User,
  MapPin,
  DollarSign,
  Settings,
  RefreshCw,
  Share2,
  Printer
} from "lucide-react";

interface Proposal {
  _id: string;
  templateId: string;
  dealId: string;
  schoolName: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  variables: Record<string, any>;
  content: string;
  sentAt?: number;
  viewedAt?: number;
  signedAt?: number;
  signatureUrl?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  template: {
    name: string;
    description: string;
    category: string;
  };
  school: {
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
  };
  pricing: {
    setupFee: number;
    monthlyFee: number;
    totalValue: number;
    currency: string;
  };
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.proposalId as string;
  const { sessionToken } = useAuth();

  const proposalData = usePlatformQuery(
    api.platform.crm.proposalQueries.getProposalById,
    { sessionToken: sessionToken || "", proposalId },
    !!sessionToken
  );

  const proposal = proposalData as any;
  const [isEditing, setIsEditing] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [proposalOverrides, setProposalOverrides] = useState<Partial<Proposal>>({});

  const effectiveProposal = proposal ? { ...proposal, ...proposalOverrides } : proposal;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "viewed": return "bg-yellow-100 text-yellow-800";
      case "signed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <FileText className="h-4 w-4" />;
      case "sent": return <Send className="h-4 w-4" />;
      case "viewed": return <Eye className="h-4 w-4" />;
      case "signed": return <Signature className="h-4 w-4" />;
      case "rejected": return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSendProposal = async () => {
    setIsSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProposalOverrides(prev => ({
      ...prev,
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now()
    }));
    setIsSending(false);
  };

  const handleSignProposal = () => {
    if (signatureData) {
      setProposalOverrides(prev => ({
        ...prev,
        status: "signed",
        signedAt: Date.now(),
        signatureUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        updatedAt: Date.now()
      }));
      setIsSignatureDialogOpen(false);
    }
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `proposal_${effectiveProposal?.schoolName?.replace(/\s+/g, '_') ?? "proposal"}.pdf`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!effectiveProposal) return <div className="p-6 text-center text-muted-foreground">{proposalData === undefined ? "Loading..." : "Proposal not found"}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Proposal: ${effectiveProposal.schoolName}`} 
        description="Manage proposal details and track e-signature status"
        breadcrumbs={[
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals", href: "/platform/crm/proposals" },
          { label: effectiveProposal.schoolName, href: `/platform/crm/proposals/${proposalId}` }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Proposal Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{effectiveProposal.schoolName}</CardTitle>
                  <p className="text-muted-foreground mt-1">{effectiveProposal.template.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(effectiveProposal.status)}`}>
                    {getStatusIcon(effectiveProposal.status)}
                    <span>{effectiveProposal.status.charAt(0).toUpperCase() + effectiveProposal.status.slice(1)}</span>
                  </div>
                  <Badge variant="outline">{effectiveProposal.template.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template</Label>
                  <div className="font-medium">{effectiveProposal.template.name}</div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div className="font-medium">{effectiveProposal.createdBy.split("@")[0]}</div>
                </div>
                <div>
                  <Label>Created Date</Label>
                  <div className="font-medium">{formatDate(effectiveProposal.createdAt)}</div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div className="font-medium">{formatDate(effectiveProposal.updatedAt)}</div>
                </div>
              </div>
              
              {effectiveProposal.sentAt && (
                <div>
                  <Label>Sent Date</Label>
                  <div className="font-medium">{formatDate(effectiveProposal.sentAt)}</div>
                </div>
              )}
              
              {effectiveProposal.signedAt && (
                <div>
                  <Label>Signed Date</Label>
                  <div className="font-medium">{formatDate(effectiveProposal.signedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposal Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Proposal Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={effectiveProposal.content}
                  onChange={(e) => setProposalOverrides(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-96"
                />
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {effectiveProposal.content}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <div className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {effectiveProposal.school.contactPerson}
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {effectiveProposal.school.email}
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {effectiveProposal.school.phone}
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {effectiveProposal.school.address}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Setup Fee</Label>
                  <div className="font-medium text-lg">
                    {formatCurrency(effectiveProposal.pricing.setupFee, effectiveProposal.pricing.currency)}
                  </div>
                </div>
                <div>
                  <Label>Monthly Fee</Label>
                  <div className="font-medium text-lg">
                    {formatCurrency(effectiveProposal.pricing.monthlyFee, effectiveProposal.pricing.currency)}
                  </div>
                </div>
                <div>
                  <Label>First Year Total</Label>
                  <div className="font-medium text-lg text-green-600">
                    {formatCurrency(effectiveProposal.pricing.totalValue, effectiveProposal.pricing.currency)}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Cost Breakdown:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Setup Fee (One-time)</span>
                    <span>{formatCurrency(effectiveProposal.pricing.setupFee, effectiveProposal.pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Subscription (12 months)</span>
                    <span>{formatCurrency(effectiveProposal.pricing.monthlyFee * 12, effectiveProposal.pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total First Year</span>
                    <span className="text-green-600">{formatCurrency(effectiveProposal.pricing.totalValue, effectiveProposal.pricing.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Section */}
          {effectiveProposal.signatureUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signature className="h-5 w-5" />
                  E-Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <img 
                      src={effectiveProposal.signatureUrl} 
                      alt="Signature" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Signed on {formatDate(effectiveProposal.signedAt!)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {effectiveProposal.status === "draft" && (
                <Button 
                  className="w-full" 
                  onClick={handleSendProposal}
                  disabled={isSending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {isSending ? "Sending..." : "Send Proposal"}
                </Button>
              )}
              
              {effectiveProposal.status === "sent" && (
                <Button className="w-full" onClick={() => setIsSignatureDialogOpen(true)}>
                  <Signature className="h-4 w-4 mr-1" />
                  Request Signature
                </Button>
              )}
              
              <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
              
              <Button variant="outline" className="w-full" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-1" />
                Share Link
              </Button>
              
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
            </CardContent>
          </Card>

          {/* Template Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(effectiveProposal.variables).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm">{key}</Label>
                  <div className="text-sm font-medium bg-muted p-2 rounded">
                    {value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-sm">Proposal Created</div>
                  <div className="text-xs text-muted-foreground">{formatDate(effectiveProposal.createdAt)}</div>
                </div>
              </div>
              
              {effectiveProposal.sentAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Proposal Sent</div>
                    <div className="text-xs text-muted-foreground">{formatDate(effectiveProposal.sentAt)}</div>
                  </div>
                </div>
              )}
              
              {effectiveProposal.viewedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Proposal Viewed</div>
                    <div className="text-xs text-muted-foreground">{formatDate(effectiveProposal.viewedAt)}</div>
                  </div>
                </div>
              )}
              
              {effectiveProposal.signedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Proposal Signed</div>
                    <div className="text-xs text-muted-foreground">{formatDate(effectiveProposal.signedAt)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request E-Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Send signature request to:</Label>
              <div className="mt-2 p-3 bg-muted rounded">
                <div className="font-medium">{effectiveProposal.school.contactPerson}</div>
                <div className="text-sm text-muted-foreground">{effectiveProposal.school.email}</div>
              </div>
            </div>
            
            <div>
              <Label>Personal Message (Optional)</Label>
              <Textarea 
                placeholder="Add a personal message for the signature request..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="terms" className="rounded" />
              <Label htmlFor="terms" className="text-sm">
                Send reminder in 3 days if not signed
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSignProposal}>
                <Send className="h-4 w-4 mr-1" />
                Send Signature Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
