"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  User,
  Paperclip,
  Send,
  EyeOff,
  X,
  Upload,
  FileText,
  Download
} from "lucide-react";

interface Comment {
  _id: string;
  authorId: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
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
  slaBreached?: boolean;
  assignedTo?: string;
  firstResponseAt?: number;
  resolvedAt?: number;
  comments: Comment[];
  attachments?: string[];
}

export default function TestCommentSystem() {
  const params = useParams();
  const ticketId = params.id as string;
  
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Mock users for @mentions
  const mockUsers = [
    { id: "agent1", email: "michael.chen@edumyles.com", name: "Michael Chen", role: "Support Agent" },
    { id: "agent2", email: "sarah.wilson@edumyles.com", name: "Sarah Wilson", role: "Support Agent" },
    { id: "tech1", email: "david.kim@edumyles.com", name: "David Kim", role: "Technical Lead" },
    { id: "admin1", email: "john.doe@edumyles.com", name: "John Doe", role: "System Admin" },
    { id: "customer1", email: "sarah.johnson@nairobi-academy.edu", name: "Sarah Johnson", role: "School Admin" }
  ];

  // Mock ticket data
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
    slaBreached: false,
    assignedTo: "michael.chen@edumyles.com",
    firstResponseAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
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
        content: "Hi @Sarah Johnson,\n\nThank you for reporting this issue. I understand this is urgent for your board meeting.\n\nI've checked your account permissions and can see there might be a configuration issue. I'm escalating this to @David Kim for immediate resolution.\n\nYou should receive an update within the next 2 hours.\n\nBest regards,\nMichael Chen",
        isInternal: false,
        attachments: [],
        createdAt: Date.now() - 5 * 60 * 60 * 1000
      },
      {
        _id: "2",
        authorId: "tech1",
        authorEmail: "david.kim@edumyles.com",
        authorRole: "Technical Lead",
        content: "Internal Note:\n\nFound the issue - the school's subscription tier doesn't include advanced reporting features. They need to upgrade to Growth tier to access attendance reports.\n\n@Michael Chen - please communicate this clearly to the customer. We should offer them a temporary upgrade for this month's board meeting.\n\n@John Doe - please review the pricing for temporary upgrades.",
        isInternal: true,
        attachments: ["pricing_tiers.pdf"],
        createdAt: Date.now() - 4 * 60 * 60 * 1000
      }
    ]
  };

  const handleAddComment = () => {
    if (newComment.trim() || uploadedFiles.length > 0) {
      console.log("Adding comment:", {
        content: newComment,
        isInternal,
        attachments: uploadedFiles.map(f => f.name),
        mentionedUsers
      });
      
      // Reset form
      setNewComment("");
      setIsInternal(false);
      setUploadedFiles([]);
      setMentionedUsers([]);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(position);
    
    // Check for @mentions
    const beforeCursor = value.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (user: typeof mockUsers[0]) => {
    const beforeMention = newComment.substring(0, cursorPosition - mentionQuery.length - 1);
    const afterCursor = newComment.substring(cursorPosition);
    
    const mentionText = `@${user.name} `;
    const newCommentText = beforeMention + mentionText + afterCursor;
    
    setNewComment(newCommentText);
    setMentionedUsers([...mentionedUsers, user.email]);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    
    // Set cursor position after the mention
    setTimeout(() => {
      const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement;
      if (textarea) {
        const newPosition = beforeMention.length + mentionText.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }
    }, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const ticketData = mockTicket;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Test Comment System" 
        description="Testing the enhanced comment functionality"
        breadcrumbs={[
          { label: "Tickets", href: "/platform/tickets" },
          { label: ticketData.title, href: `/platform/tickets/${ticketId}` }
        ]}
      />

      {/* Comment Thread Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comment Thread Test ({ticketData.comments?.length || 0} comments)
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
                      <div className="text-sm whitespace-pre-wrap">
                        {comment.content.split(/(@\w+)/).map((part, index) => {
                          // Check if this part is a mention
                          if (part.startsWith('@')) {
                            const userName = part.substring(1);
                            const mentionedUser = mockUsers.find(u => 
                              u.name.toLowerCase().includes(userName.toLowerCase()) ||
                              u.email.toLowerCase().includes(userName.toLowerCase())
                            );
                            
                            if (mentionedUser) {
                              return (
                                <span key={index} className="inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  <span>@{mentionedUser.name}</span>
                                </span>
                              );
                            }
                          }
                          return part;
                        })}
                      </div>
                      
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            <span>{comment.attachments.length} attachment(s)</span>
                          </div>
                          <div className="space-y-1">
                            {comment.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{attachment}</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {index < ticketData.comments.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          <Separator />

          {/* Add Comment Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Add Comment (Test)</h4>
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
            
            {/* Mention Suggestions */}
            {showMentionSuggestions && mentionQuery && (
              <div className="relative">
                <div className="absolute top-0 left-0 z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleMentionSelect(user)}
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                id="comment-textarea"
                value={newComment}
                onChange={handleTextareaChange}
                placeholder="Type your comment here... Use @ to mention people"
                className="min-h-24"
              />
              
              {/* Character count and mention indicators */}
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {newComment.length} chars
                {mentionedUsers.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    {mentionedUsers.length} mentioned
                  </span>
                )}
              </div>
            </div>
            
            {/* File Attachments */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Attachments</div>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" type="button">
                    <Upload className="h-4 w-4 mr-1" />
                    Attach Files
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() && uploadedFiles.length === 0}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
