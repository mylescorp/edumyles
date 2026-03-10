"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  User,
  Calendar,
  Paperclip,
  Send,
  Reply,
  Eye,
  EyeOff,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  Users,
  FileText,
  Settings,
  Archive,
  Flag,
  MoreHorizontal,
  Edit,
  Trash2,
  Link,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Copy,
  Share,
  Info,
  X,
  Zap
} from "lucide-react";

interface Comment {
  _id: string;
  authorId: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: number;
}

interface Ticket {
  _id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  status: string;
  tenantName: string;
  createdAt: number;
  slaResolutionDL: number;
  slaFirstResponseDL: number;
  slaBreached?: boolean;
  assignedTo?: string;
  firstResponseAt?: number;
  resolvedAt?: number;
  comments: Comment[];
  attachments?: string[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [showCcModal, setShowCcModal] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newCcEmail, setNewCcEmail] = useState("");

  const { data: ticket, isLoading } = useQuery(api.tickets.getTicket, { ticketId });
  const updateStatus = useMutation(api.tickets.updateTicketStatus);
  const addComment = useMutation(api.tickets.addComment);

  // Mock ticket data for demonstration
  const mockTicket: Ticket = {
    _id: ticketId,
    title: "Unable to access student attendance reports",
    body: "Hello,\n\nI'm having trouble accessing the student attendance reports for the past month. When I try to generate the report, I get an error message saying 'Insufficient permissions' even though I'm the school administrator.\n\nI need this report urgently for our upcoming board meeting scheduled for next week. The attendance data is crucial for our compliance reporting.\n\nI've tried:\n1. Logging out and back in\n2. Clearing browser cache\n3. Using a different browser\n4. Asking other staff members to try (they get the same error)\n\nThis is affecting our ability to track student attendance and could impact our funding requirements.\n\nPlease help resolve this as soon as possible.\n\nThank you,\nSarah Johnson\nSchool Administrator",
    category: "Technical Issue",
    priority: "P1",
    status: "in_progress",
    tenantName: "Nairobi International Academy",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    slaResolutionDL: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    slaFirstResponseDL: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago (breached)
    slaBreached: true,
    assignedTo: "agent1@edumyles.com",
    firstResponseAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    resolvedAt: undefined,
    attachments: [
      "screenshot_error.png",
      "browser_console.log",
      "permission_settings.pdf"
    ],
    comments: [
      {
        _id: "1",
        authorId: "agent1",
        authorEmail: "michael.chen@edumyles.com",
        authorRole: "Support Agent",
        content: "Hi Sarah,\n\nThank you for reporting this issue. I understand this is urgent for your board meeting.\n\nI've checked your account permissions and can see there might be a configuration issue with your role settings. I'm escalating this to our technical team for immediate resolution.\n\nYou should receive an update within the next 2 hours.\n\nBest regards,\nMichael Chen\nEduMyles Support Team",
        isInternal: false,
        attachments: [],
        createdAt: Date.now() - 5 * 60 * 60 * 1000
      },
      {
        _id: "2",
        authorId: "tech1",
        authorEmail: "david.kim@edumyles.com",
        authorRole: "Technical Lead",
        content: "Internal Note:\n\nFound the issue - the school's subscription tier doesn't include advanced reporting features. They need to upgrade to Growth tier to access attendance reports.\n\nSLA is breached for first response. Need to communicate this clearly to the customer.",
        isInternal: true,
        attachments: [],
        createdAt: Date.now() - 4 * 60 * 60 * 1000
      },
      {
        _id: "3",
        authorId: "agent1",
        authorEmail: "michael.chen@edumyles.com",
        authorRole: "Support Agent",
        content: "Hi Sarah,\n\nI have an update from our technical team. The issue is related to your current subscription plan. The advanced attendance reporting features are available on our Growth tier and above.\n\nI can see you're currently on the Starter tier. Would you like me to connect you with our sales team to discuss upgrading your plan? We can offer a temporary upgrade for this month to help with your board meeting.\n\nPlease let me know how you'd like to proceed.\n\nBest regards,\nMichael",
        isInternal: false,
        attachments: [],
        createdAt: Date.now() - 3 * 60 * 60 * 1000
      },
      {
        _id: "4",
        authorId: "sarah",
        authorEmail: "sarah.johnson@nairobi-academy.edu",
        authorRole: "School Admin",
        content: "Hi Michael,\n\nThank you for the update. I wasn't aware that attendance reports were a premium feature. Yes, we'd definitely be interested in a temporary upgrade for this month, and we can discuss the long-term plan after our board meeting.\n\nCould you please arrange the temporary upgrade? We need the reports by Friday at the latest.\n\nThank you for your help!\n\nSarah",
        isInternal: false,
        attachments: [],
        createdAt: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        _id: "5",
        authorId: "agent1",
        authorEmail: "michael.chen@edumyles.com",
        authorRole: "Support Agent",
        content: "Hi Sarah,\n\nPerfect! I've arranged a temporary upgrade to the Growth tier for this month. You should now have access to the attendance reports.\n\nI've also scheduled a call with our sales team for next Tuesday to discuss your long-term needs.\n\nPlease try accessing the reports now and let me know if you encounter any issues.\n\nBest regards,\nMichael",
        isInternal: false,
        attachments: [],
        createdAt: Date.now() - 1 * 60 * 60 * 1000
      }
    ]
  };

  // Use mock data if no real data available
  const ticketData = ticket || mockTicket;

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      updateStatus({
        ticketId,
        status: selectedStatus as any,
        assignedTo: selectedAssignee || undefined,
      });
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment({
        ticketId,
        content: newComment,
        isInternal,
      });
      setNewComment("");
    }
  };

  const addCcEmail = () => {
    if (newCcEmail.trim() && !ccEmails.includes(newCcEmail.trim())) {
      setCcEmails([...ccEmails, newCcEmail.trim()]);
      setNewCcEmail("");
    }
  };

  const removeCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "bg-red-100 text-red-700 border-red-200";
      case "P1": return "bg-orange-100 text-orange-700 border-orange-200";
      case "P2": return "bg-blue-100 text-blue-700 border-blue-200";
      case "P3": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending_school": return "bg-purple-100 text-purple-700 border-purple-200";
      case "resolved": return "bg-green-100 text-green-700 border-green-200";
      case "closed": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline - now;
    
    if (timeLeft < 0) {
      return { text: "Overdue", color: "text-red-600" };
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, color: "text-yellow-600" };
    }
    
    return { text: `${hours}h ${minutes}m`, color: hours < 2 ? "text-red-600" : "text-yellow-600" };
  };

  if (isLoading) {
    return <div>Loading ticket...</div>;
  }

  if (!ticketData) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={ticketData.title} 
        description={`Ticket #${ticketId} • ${ticketData.category}`}
        breadcrumbs={[
          { label: "Tickets", href: "/platform/tickets" },
          { label: ticketData.title, href: `/platform/tickets/${ticketId}` }
        ]}
      />

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Info Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Ticket Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status & Priority */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(ticketData.status)}>
                    {ticketData.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority</span>
                  <Badge className={getPriorityColor(ticketData.priority)}>
                    {ticketData.priority}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* School Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">School</span>
                </div>
                <p className="text-sm text-muted-foreground">{ticketData.tenantName}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Nairobi, Kenya</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">450 Students</span>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact</span>
                </div>
                <p className="text-sm text-muted-foreground">+254 712 345 678</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">admin@school.edu</p>
                </div>
              </div>

              <Separator />

              {/* Assignment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Assigned To</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {ticketData.assignedTo ? ticketData.assignedTo.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ticketData.assignedTo || "Unassigned"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* SLA Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">SLA Status</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span>First Response</span>
                      <span className={formatTimeRemaining(ticketData.slaFirstResponseDL).color}>
                        {formatTimeRemaining(ticketData.slaFirstResponseDL).text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, ((ticketData.slaFirstResponseDL - Date.now()) / (ticketData.slaFirstResponseDL - ticketData.createdAt)) * 100))}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Resolution</span>
                      <span className={formatTimeRemaining(ticketData.slaResolutionDL).color}>
                        {formatTimeRemaining(ticketData.slaResolutionDL).text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, ((ticketData.slaResolutionDL - Date.now()) / (ticketData.slaResolutionDL - ticketData.createdAt)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {ticketData.slaBreached && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">SLA Breached</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span>{new Date(ticketData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Category</span>
                  <span>{ticketData.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ticket ID</span>
                  <span>#{ticketId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Thread (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Ticket Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticketData.body}</p>
              
              {ticketData.attachments && ticketData.attachments.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({ticketData.attachments.length})
                  </div>
                  <div className="space-y-2">
                    {ticketData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Thread ({ticketData.comments?.length || 0} comments)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticketData.comments?.map((comment, index) => (
                  <div key={comment._id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {comment.authorEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.authorEmail}</span>
                            <Badge variant="outline" className="text-xs">
                              {comment.authorRole}
                            </Badge>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Internal
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${
                          comment.isInternal 
                            ? "bg-amber-50 border border-amber-200" 
                            : "bg-muted"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-xs text-muted-foreground">
                                {comment.attachments.length} attachment(s)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {index < ticketData.comments.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Add Comment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Add Comment</h4>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <span>Internal Note</span>
                    </label>
                  </div>
                </div>
                
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  className="min-h-24"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                    </Button>
                    <Button variant="outline" size="sm">
                      <Link className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStatus("in_progress");
                        setSelectedAssignee("current-user@example.com");
                      }}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Assign to Me
                    </Button>
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-1" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Related Ticket
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View School Details
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Contact School
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archive Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_school">Pending School</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Priority</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0 - Critical</SelectItem>
                    <SelectItem value="P1">P1 - High</SelectItem>
                    <SelectItem value="P2">P2 - Medium</SelectItem>
                    <SelectItem value="P3">P3 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Assign To</Label>
                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    <SelectItem value="agent1@edumyles.com">Agent 1</SelectItem>
                    <SelectItem value="agent2@edumyles.com">Agent 2</SelectItem>
                    <SelectItem value="agent3@edumyles.com">Agent 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleStatusUpdate} 
                disabled={!selectedStatus}
                className="w-full"
              >
                Update Ticket
              </Button>
            </CardContent>
          </Card>

          {/* CC/BCC */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                CC/BCC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowCcModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add CC/BCC
              </Button>
              
              {ccEmails.length > 0 && (
                <div className="space-y-1">
                  {ccEmails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{email}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeCcEmail(email)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                  <div>
                    <p className="text-sm font-medium">Ticket Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticketData.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {ticketData.firstResponseAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium">First Response</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticketData.firstResponseAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {ticketData.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium">Ticket Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticketData.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="h-5 w-5" />
                Related Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View School Profile
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Previous Tickets
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Student Records
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CC/BCC Modal */}
      {showCcModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add CC/BCC</span>
                <Button variant="ghost" size="sm" onClick={() => setShowCcModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCcEmail}
                    onChange={(e) => setNewCcEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                  <Button onClick={addCcEmail}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {ccEmails.length > 0 && (
                <div className="space-y-2">
                  <Label>CC/BCC List</Label>
                  <div className="space-y-1">
                    {ccEmails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{email}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeCcEmail(email)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCcModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCcModal(false)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
