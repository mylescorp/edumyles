"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  GraduationCap, 
  FileText, 
  Calendar,
  MapPin,
  Briefcase,
  MessageSquare,
  Search,
  Plus,
  Download,
  Eye,
  Send,
  Globe,
  Award,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface AlumniProfile {
  _id: string;
  firstName: string;
  lastName: string;
  graduationYear: string;
  course: string;
  currentOccupation: string;
  company: string;
  location: string;
  email: string;
  bio: string;
  achievements: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

interface TranscriptRequest {
  _id: string;
  alumniId: string;
  type: string;
  status: string;
  requestedAt: number;
  processedAt?: number;
  notes?: string;
}

export default function AlumniDashboardPage() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [requestType, setRequestType] = useState("official");
  const [requestNotes, setRequestNotes] = useState("");

  // Mock data - in real app, these would come from queries
  const alumniProfile: AlumniProfile = {
    _id: "alumni-1",
    firstName: "John",
    lastName: "Doe",
    graduationYear: "2020",
    course: "Computer Science",
    currentOccupation: "Software Engineer",
    company: "Tech Company",
    location: "Nairobi, Kenya",
    email: "john.doe@email.com",
    bio: "Passionate software developer with expertise in web technologies.",
    achievements: [
      "Dean's List 2019",
      "Best Project Award 2020",
      "Tech Innovation Award 2022"
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/in/johndoe",
      twitter: "https://twitter.com/johndoe",
      website: "https://johndoe.dev"
    }
  };

  const alumniDirectory = [
    alumniProfile,
    {
      ...alumniProfile,
      _id: "alumni-2",
      firstName: "Jane",
      lastName: "Smith",
      graduationYear: "2019",
      course: "Business Administration",
      currentOccupation: "Marketing Manager",
      company: "Marketing Agency",
      location: "Mombasa, Kenya"
    }
  ];

  const transcriptRequests: TranscriptRequest[] = [
    {
      _id: "req-1",
      alumniId: "alumni-1",
      type: "official",
      status: "approved",
      requestedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      processedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
    }
  ];

  const networkingEvents = [
    {
      _id: "event-1",
      title: "Alumni Networking Night",
      date: "2024-04-15",
      location: "School Campus",
      type: "networking",
      attendees: 45
    },
    {
      _id: "event-2",
      title: "Career Fair 2024",
      date: "2024-05-20",
      location: "School Auditorium",
      type: "career",
      attendees: 120
    }
  ];

  const createTranscriptRequest = useMutation(api.modules.alumni.mutations.createTranscriptRequest);

  const handleRequestTranscript = async () => {
    try {
      await createTranscriptRequest({
        type: requestType,
        notes: requestNotes,
      });
      
      toast({
        title: "Success",
        description: "Transcript request submitted successfully",
      });
      
      setRequestNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit transcript request",
        variant: "destructive"
      });
    }
  };

  const filteredAlumni = alumniDirectory.filter(alumni =>
    `${alumni.firstName} ${alumni.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.currentOccupation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Alumni Portal"
        description="Connect with alumni and manage your academic records"
      />

      <div className="space-y-6">
        {/* Alumni Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {alumniProfile.firstName} {alumniProfile.lastName}
                  </h3>
                  <p className="text-muted-foreground">
                    Class of {alumniProfile.graduationYear}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{alumniProfile.currentOccupation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{alumniProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{alumniProfile.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Achievements</h4>
                  <div className="space-y-1">
                    {alumniProfile.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Social Links</h4>
                  <div className="flex gap-2">
                    {alumniProfile.socialLinks.linkedin && (
                      <Button size="sm" variant="outline">
                        <Globe className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Request Transcript
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Events
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transcript Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestType">Request Type</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">Official Transcript</SelectItem>
                      <SelectItem value="unofficial">Unofficial Transcript</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any special requirements or notes..."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button onClick={handleRequestTranscript} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Transcript Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transcriptRequests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium capitalize">{request.type} Transcript</h4>
                        <Badge 
                          variant={request.status === "approved" ? "default" : "secondary"}
                        >
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Requested</p>
                          <p className="font-medium">
                            {format(new Date(request.requestedAt), "PPP")}
                          </p>
                        </div>
                        {request.processedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Processed</p>
                            <p className="font-medium">
                              {format(new Date(request.processedAt), "PPP")}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {request.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {request.status === "approved" && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alumni Directory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alumni Directory
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Alumni</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, course, or occupation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Graduation Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="business">Business Administration</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Alumni List */}
            <div className="space-y-4">
              {filteredAlumni.map((alumni) => (
                <div key={alumni._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {alumni.firstName} {alumni.lastName}
                        </h4>
                        <Badge variant="outline">
                          Class of {alumni.graduationYear}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Course</p>
                          <p className="font-medium">{alumni.course}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Position</p>
                          <p className="font-medium">{alumni.currentOccupation}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{alumni.company}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{alumni.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Networking Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {networkingEvents.map((event) => (
                <div key={event._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant="outline">
                          {event.type}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(new Date(event.date), "PPP")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{event.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.attendees} alumni attending
                        </span>
                      </div>
                    </div>
                    
                    <Button size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      RSVP
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
