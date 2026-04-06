"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, Users, FileText, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Assignment = {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  dueTime?: string;
  maxPoints: number;
  type: string;
  status: string;
  className: string;
  subjectName: string;
  teacherName: string;
  submissionsCount: number;
  createdAt: number;
  updatedAt: number;
};

type CreateAssignmentData = {
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  dueTime: string;
  maxPoints: number;
  type: string;
  classId: string;
  subjectId: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  publishImmediately: boolean;
};

export function AssignmentManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    dueTime: "09:00",
    maxPoints: 100,
    type: "homework",
    classId: "",
    subjectId: "",
    allowLateSubmission: false,
    latePenalty: 0,
    publishImmediately: true,
  });

  // Fetch assignments
  const assignments = useQuery(api.modules.academics.assignments.listAssignments, {}) || [];
  
  // Fetch classes and subjects for dropdowns
  const classes = useQuery(api.modules.sis.queries.listClasses, {}) || [];
  const subjects = useQuery(api.modules.academics.queries.getSubjects, {}) || [];

  // Mutations
  const createAssignment = useMutation(api.modules.academics.mutations.createAssignment);
  const updateAssignment = useMutation(api.modules.academics.mutations.updateAssignment);
  const deleteAssignment = useMutation(api.modules.academics.mutations.deleteAssignment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAssignment) {
        await updateAssignment({
          assignmentId: editingAssignment._id as any,
          updates: {
            title: formData.title,
            description: formData.description,
            instructions: formData.instructions,
            dueDate: formData.dueDate,
            dueTime: formData.dueTime,
            maxPoints: formData.maxPoints,
            type: formData.type,
            allowLateSubmission: formData.allowLateSubmission,
            latePenalty: formData.latePenalty,
          },
        });
        toast.success("Assignment updated successfully");
      } else {
        await createAssignment(formData);
        toast.success("Assignment created successfully");
      }
      
      setIsCreateDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to save assignment");
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || "",
      dueDate: assignment.dueDate,
      dueTime: assignment.dueTime || "09:00",
      maxPoints: assignment.maxPoints,
      type: assignment.type,
      classId: "", // Would need to be populated from class data
      subjectId: "", // Would need to be populated from subject data
      allowLateSubmission: false,
      latePenalty: 0,
      publishImmediately: assignment.status === "published",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await deleteAssignment({ assignmentId: assignmentId as any });
        toast.success("Assignment deleted successfully");
      } catch (error) {
        toast.error("Failed to delete assignment");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructions: "",
      dueDate: "",
      dueTime: "09:00",
      maxPoints: 100,
      type: "homework",
      classId: "",
      subjectId: "",
      allowLateSubmission: false,
      latePenalty: 0,
      publishImmediately: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "closed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "homework": return "bg-blue-100 text-blue-800";
      case "exam": return "bg-red-100 text-red-800";
      case "quiz": return "bg-purple-100 text-purple-800";
      case "project": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignment Management</h1>
          <p className="text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAssignment(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
              </DialogTitle>
              <DialogDescription>
                {editingAssignment 
                  ? "Update the assignment details below."
                  : "Fill in the details to create a new assignment."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assignment title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="classwork">Classwork</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Assignment description"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Detailed instructions for students"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Max Points *</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject *</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latePenalty">Late Penalty (%)</Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    value={formData.latePenalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, latePenalty: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowLateSubmission"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowLateSubmission: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="publishImmediately"
                  checked={formData.publishImmediately}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishImmediately: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="publishImmediately">Publish Immediately</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAssignment ? "Update Assignment" : "Create Assignment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first assignment to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment: Assignment) => (
            <Card key={assignment._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{assignment.title}</CardTitle>
                      <Badge className={getTypeColor(assignment.type)}>
                        {assignment.type}
                      </Badge>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {assignment.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(assignment._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Class:</span>
                    <span>{assignment.className}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Subject:</span>
                    <span>{assignment.subjectName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Due:</span>
                    <span>{format(new Date(assignment.dueDate), "MMM d, yyyy")}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Points:</span>
                    <span>{assignment.maxPoints}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Teacher: {assignment.teacherName}</p>
                  <p>Submissions: {assignment.submissionsCount}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
