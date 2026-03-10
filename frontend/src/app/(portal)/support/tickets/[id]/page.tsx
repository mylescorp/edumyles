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
  Plus,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

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
  createdAt: number;
  slaResolutionDL: number;
  slaFirstResponseDL: number;
  slaBreached?: boolean;
  assignedTo?: string;
  firstResponseAt?: number;
  resolvedAt?: number;
  comments: Comment[];
}

export default function SchoolTicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  
  const [newComment, setNewComment] = useState("");

  // TODO: Get actual tenant ID from auth context
  const tenantId = "temp-tenant-id" as any;
  
  const { data: ticket, isLoading } = useQuery(api.tickets.getTicket, { ticketId });
  const addComment = useMutation(api.tickets.addComment);

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment({
        ticketId,
        content: newComment,
        isInternal: false, // School users can only post public comments
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

  // Filter out internal comments for school view
  const publicComments = ticket.comments?.filter(comment => !comment.isInternal) || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={ticket.title} 
        description={`Ticket #${ticketId} • ${ticket.category}`}
        breadcrumbs={[
          { label: "Support", href: "/support" },
          { label: "Tickets", href: "/support/tickets" },
          { label: ticket.title, href: `/support/tickets/${ticketId}` }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left & Middle Columns - Ticket Details & Comments */}
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
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
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
                <span>Comments ({publicComments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {publicComments.map((comment) => (
                  <div key={comment._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{comment.authorEmail}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.authorRole === "support_agent" ? "Support Agent" : comment.authorRole}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
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

              {publicComments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No comments yet</p>
                </div>
              )}

              <Separator />

              {/* Add Comment */}
              <div className="space-y-3">
                <h4 className="font-semibold">Add Comment</h4>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  className="min-h-24"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-1" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/support/tickets/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/support/tickets">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tickets
                </Link>
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

          {/* Support Info */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you need immediate assistance, contact our support team:
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Email:</strong> support@edumyles.com
                </div>
                <div>
                  <strong>Phone:</strong> +254 XXX XXX XXX
                </div>
                <div>
                  <strong>Hours:</strong> Mon-Fri, 8AM-6PM EAT
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
