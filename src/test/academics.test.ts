import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";

describe("Academics Module", () => {
  let ctx: any;

  beforeEach(() => {
    ctx = convexTest();
  });

  describe("Assignments", () => {
    it("should create an assignment successfully", async () => {
      const result = await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "Math Homework 1",
        description: "Complete exercises 1-10",
        instructions: "Show your work",
        dueDate: "2025-02-15",
        dueTime: "17:00",
        maxPoints: 100,
        type: "homework",
        allowLateSubmission: true,
        latePenalty: 10,
        publishImmediately: true,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should list assignments for a class", async () => {
      // First create an assignment
      await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "Science Quiz",
        description: "Chapter 5 quiz",
        dueDate: "2025-02-20",
        maxPoints: 50,
        type: "quiz",
        publishImmediately: true,
      });

      const assignments = await ctx.runQuery(api.modules.academics.listAssignments, {
        classId: "class1",
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0].title).toBe("Science Quiz");
      expect(assignments[0].type).toBe("quiz");
    });

    it("should update an assignment", async () => {
      // Create assignment first
      const assignmentId = await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "Original Title",
        description: "Original description",
        dueDate: "2025-02-15",
        maxPoints: 100,
        type: "homework",
        publishImmediately: true,
      });

      // Update the assignment
      await ctx.runMutation(api.modules.academics.updateAssignment, {
        assignmentId: assignmentId as any,
        updates: {
          title: "Updated Title",
          description: "Updated description",
          maxPoints: 150,
        },
      });

      // Verify update
      const assignments = await ctx.runQuery(api.modules.academics.listAssignments, {});
      const updatedAssignment = assignments.find(a => a._id === assignmentId);
      
      expect(updatedAssignment?.title).toBe("Updated Title");
      expect(updatedAssignment?.description).toBe("Updated description");
      expect(updatedAssignment?.maxPoints).toBe(150);
    });

    it("should delete an assignment", async () => {
      // Create assignment first
      const assignmentId = await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "To Delete",
        description: "This will be deleted",
        dueDate: "2025-02-15",
        maxPoints: 100,
        type: "homework",
        publishImmediately: true,
      });

      // Delete the assignment
      await ctx.runMutation(api.modules.academics.deleteAssignment, {
        assignmentId: assignmentId as any,
      });

      // Verify deletion
      const assignments = await ctx.runQuery(api.modules.academics.listAssignments, {});
      const deletedAssignment = assignments.find(a => a._id === assignmentId);
      
      expect(deletedAssignment).toBeUndefined();
    });
  });

  describe("Submissions", () => {
    it("should submit an assignment", async () => {
      // Create assignment first
      const assignmentId = await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "Essay Assignment",
        description: "Write a 500-word essay",
        dueDate: "2025-02-20",
        maxPoints: 100,
        type: "homework",
        publishImmediately: true,
      });

      // Submit the assignment
      const result = await ctx.runMutation(api.modules.academics.submitAssignment, {
        assignmentId: assignmentId as any,
        content: "This is my essay submission...",
        attachments: ["essay.pdf"],
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();
    });

    it("should grade a submission", async () => {
      // Create assignment and submit it
      const assignmentId = await ctx.runMutation(api.modules.academics.createAssignment, {
        classId: "class1",
        subjectId: "subject1",
        title: "Test Assignment",
        description: "Complete the test",
        dueDate: "2025-02-20",
        maxPoints: 100,
        type: "homework",
        publishImmediately: true,
      });

      const submissionResult = await ctx.runMutation(api.modules.academics.submitAssignment, {
        assignmentId: assignmentId as any,
        content: "My test answers...",
      });

      // Grade the submission
      const gradeResult = await ctx.runMutation(api.modules.academics.gradeSubmission, {
        submissionId: submissionResult.submissionId as any,
        score: 85,
        grade: "B",
        feedback: "Good work, but could improve on section 2",
      });

      expect(gradeResult).toBeDefined();
    });
  });

  describe("Grades", () => {
    it("should bulk enter grades for students", async () => {
      const result = await ctx.runMutation(api.modules.academics.enterGrades, {
        grades: [
          {
            studentId: "student1",
            classId: "class1",
            subjectId: "subject1",
            term: "Term 1",
            academicYear: "2025",
            score: 85,
            grade: "B",
            remarks: "Good performance",
            recordedBy: "teacher1",
          },
          {
            studentId: "student2",
            classId: "class1",
            subjectId: "subject1",
            term: "Term 1",
            academicYear: "2025",
            score: 92,
            grade: "A-",
            remarks: "Excellent work",
            recordedBy: "teacher1",
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it("should retrieve grades for a class", async () => {
      // First enter some grades
      await ctx.runMutation(api.modules.academics.enterGrades, {
        grades: [
          {
            studentId: "student1",
            classId: "class1",
            subjectId: "math",
            term: "Term 1",
            academicYear: "2025",
            score: 88,
            grade: "B+",
            recordedBy: "teacher1",
          },
        ],
      });

      // Retrieve grades
      const grades = await ctx.runQuery(api.modules.academics.getGrades, {
        classId: "class1",
        subjectId: "math",
        term: "Term 1",
      });

      expect(grades).toHaveLength(1);
      expect(grades[0].score).toBe(88);
      expect(grades[0].grade).toBe("B+");
    });
  });

  describe("Report Cards", () => {
    it("should generate a report card", async () => {
      // First enter some grades
      await ctx.runMutation(api.modules.academics.enterGrades, {
        grades: [
          {
            studentId: "student1",
            classId: "class1",
            subjectId: "math",
            term: "Term 1",
            academicYear: "2025",
            score: 85,
            grade: "B",
            recordedBy: "teacher1",
          },
          {
            studentId: "student1",
            classId: "class1",
            subjectId: "english",
            term: "Term 1",
            academicYear: "2025",
            score: 90,
            grade: "A-",
            recordedBy: "teacher2",
          },
        ],
      });

      // Generate report card
      const result = await ctx.runMutation(api.modules.academics.generateReportCard, {
        studentId: "student1",
        term: "Term 1",
        academicYear: "2025",
        includeAttendance: true,
        includeComments: true,
      });

      expect(result.reportCardId).toBeDefined();
      expect(result.gpa).toBeGreaterThan(0);
      expect(result.rank).toBeGreaterThan(0);
      expect(result.grades).toHaveLength(2);
    });
  });

  describe("Examinations", () => {
    it("should create an examination", async () => {
      const result = await ctx.runMutation(api.modules.academics.createExamination, {
        name: "Mid-Term Mathematics Exam",
        classId: "class1",
        subjectId: "math",
        date: "2025-03-15",
        startTime: "09:00",
        endTime: "11:00",
        venue: "Main Hall",
        totalMarks: 100,
        passMark: 50,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should update examination status", async () => {
      // Create examination first
      const examId = await ctx.runMutation(api.modules.academics.createExamination, {
        name: "Science Test",
        classId: "class1",
        subjectId: "science",
        date: "2025-03-20",
        startTime: "10:00",
        endTime: "11:30",
        totalMarks: 50,
        passMark: 25,
      });

      // Update status to "ongoing"
      await ctx.runMutation(api.modules.academics.updateExaminationStatus, {
        id: examId as any,
        status: "ongoing",
      });

      // Verify status update
      const exams = await ctx.runQuery(api.modules.academics.getRecentExams, {});
      const updatedExam = exams.find(e => e._id === examId);
      
      expect(updatedExam?.status).toBe("ongoing");
    });
  });

  describe("Attendance", () => {
    it("should bulk mark attendance", async () => {
      const result = await ctx.runMutation(api.modules.academics.markAttendance, {
        records: [
          {
            classId: "class1",
            studentId: "student1",
            date: "2025-02-15",
            status: "present",
            recordedBy: "teacher1",
          },
          {
            classId: "class1",
            studentId: "student2",
            date: "2025-02-15",
            status: "absent",
            remarks: "Sick leave",
            recordedBy: "teacher1",
          },
          {
            classId: "class1",
            studentId: "student3",
            date: "2025-02-15",
            status: "late",
            recordedBy: "teacher1",
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it("should retrieve attendance records", async () => {
      // First mark some attendance
      await ctx.runMutation(api.modules.academics.markAttendance, {
        records: [
          {
            classId: "class1",
            studentId: "student1",
            date: "2025-02-15",
            status: "present",
            recordedBy: "teacher1",
          },
        ],
      });

      // Retrieve attendance
      const attendance = await ctx.runQuery(api.modules.academics.getAttendance, {
        classId: "class1",
        dateFrom: "2025-02-14",
        dateTo: "2025-02-16",
      });

      expect(attendance).toHaveLength(1);
      expect(attendance[0].status).toBe("present");
    });
  });

  describe("Academics Statistics", () => {
    it("should return academics statistics", async () => {
      // Create some test data
      await ctx.runMutation(api.modules.academics.enterGrades, {
        grades: [
          {
            studentId: "student1",
            classId: "class1",
            subjectId: "math",
            term: "Term 1",
            academicYear: "2025",
            score: 85,
            grade: "B",
            recordedBy: "teacher1",
          },
        ],
      });

      const stats = await ctx.runQuery(api.modules.academics.getAcademicsStats, {});

      expect(stats).toBeDefined();
      expect(typeof stats.averageScore).toBe("number");
      expect(typeof stats.totalStudents).toBe("number");
      expect(typeof stats.totalAssignments).toBe("number");
    });
  });
});
