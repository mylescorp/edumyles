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
  Plus
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
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const { data: ticket, isLoading } = useQuery(api.tickets.getTicket, { ticketId });
  const updateStatus = useMutation(api.tickets.updateTicketStatus);
  const addComment = useMutation(api.tickets.addComment);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "bg-danger-bg text-danger border-danger";
      case "P1": return "bg-warning-bg text-em-accent-dark border-warning";
      case "P2": return "bg-info-bg text-info border-info";
      case "P3": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-info-bg text-info";
      case "in_progress": return "bg-warning-bg text-em-accent-dark";
      case "pending_school": return "bg-secondary-bg text-secondary";
      case "resolved": return "bg-success-bg text-success";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline - now;
    
    if (timeLeft < 0) {
      return { text: "Overdue", color: "text-danger" };
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, color: "text-warning" };
    }
    
    return { text: `${hours}h ${minutes}m`, color: hours < 2 ? "text-danger" : "text-warning" };
  };

  if (isLoading) {
    return <div>Loading ticket...</div>;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={ticket.title} 
        description={`Ticket #${ticketId} • ${ticket.category}`}
        breadcrumbs={[
          { label: "Tickets", href: "/platform/tickets" },
          { label: ticket.title, href: `/platform/tickets/${ticketId}` }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Ticket Details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{ticket.body}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">School</h4>
                  <p className="text-muted-foreground">{ticket.tenantName}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <p className="text-muted-foreground">{ticket.category}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Priority</h4>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Assigned To</h4>
                  <p className="text-muted-foreground">
                    {ticket.assignedTo || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Created</h4>
                  <p className="text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">First Response</h4>
                  <p className="text-muted-foreground">
                    {ticket.firstResponseAt 
                      ? new Date(ticket.firstResponseAt).toLocaleString()
                      : "Pending"
                    }
                  </p>
                </div>
              </div>

              {/* SLA Information */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">SLA Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">First Response</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeRemaining(ticket.slaFirstResponseDL).text}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Resolution</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeRemaining(ticket.slaResolutionDL).text}
                    </p>
                  </div>
                </div>
                {ticket.slaBreached && (
                  <div className="flex items-center space-x-2 mt-2 text-danger">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">SLA Breached</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Comments ({ticket.comments?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticket.comments?.map((comment) => (
                  <div key={comment._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
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
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      comment.isInternal 
                        ? "bg-amber-50 border border-amber-200" 
                        : "bg-muted"
                    }`}>
                      <p className="text-sm">{comment.content}</p>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs text-muted-foreground">
                            {comment.attachments.length} attachment(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Add Comment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Add Comment</h4>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
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
                  <div className="flex items-center space-x-2">
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
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-1" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Related Ticket
              </Button>
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View School Details
              </Button>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Status</label>
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
                <label className="text-sm font-medium">Assign To</label>
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

          {/* Ticket Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-info rounded-full mt-1"></div>
                  <div>
                    <p className="text-sm font-medium">Ticket Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {ticket.firstResponseAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-warning rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium">First Response</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.firstResponseAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {ticket.resolvedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-success rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium">Ticket Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
