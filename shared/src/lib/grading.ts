// ============================================================
// EduMyles — Grade Calculation System
// ============================================================

export interface Grade {
  score: number;
  maxScore: number;
  weight: number; // Relative importance (e.g., exam weight)
  type: 'assignment' | 'quiz' | 'exam' | 'project' | 'participation';
}

export interface GradeResult {
  letterGrade: string;
  gradePoints: number;
  percentage: number;
  remarks: string;
}

export interface GPAData {
  gpa: number;
  totalCredits: number;
  gradePoints: number;
  classification: 'First Class' | 'Second Class Upper' | 'Second Class Lower' | 'Pass' | 'Fail';
}

export class GradingSystem {
  // East African grading scales (Kenya as primary)
  private static readonly KENYA_GRADING_SCALE = [
    { min: 70, max: 100, grade: 'A', points: 12, remarks: 'Excellent' },
    { min: 60, max: 69, grade: 'B', points: 11, remarks: 'Very Good' },
    { min: 50, max: 59, grade: 'C', points: 10, remarks: 'Good' },
    { min: 40, max: 49, grade: 'D', points: 9, remarks: 'Satisfactory' },
    { min: 0, max: 39, grade: 'E', points: 8, remarks: 'Fail' },
  ];

  private static readonly UGANDA_GRADING_SCALE = [
    { min: 80, max: 100, grade: 'A', points: 4.0, remarks: 'Excellent' },
    { min: 75, max: 79, grade: 'B', points: 3.0, remarks: 'Very Good' },
    { min: 70, max: 74, grade: 'C', points: 2.0, remarks: 'Good' },
    { min: 65, max: 69, grade: 'D', points: 1.0, remarks: 'Satisfactory' },
    { min: 0, max: 64, grade: 'F', points: 0.0, remarks: 'Fail' },
  ];

  private static readonly TANZANIA_GRADING_SCALE = [
    { min: 75, max: 100, grade: 'A', points: 4.0, remarks: 'Excellent' },
    { min: 65, max: 74, grade: 'B', points: 3.0, remarks: 'Very Good' },
    { min: 55, max: 64, grade: 'C', points: 2.0, remarks: 'Good' },
    { min: 45, max: 54, grade: 'D', points: 1.0, remarks: 'Satisfactory' },
    { min: 0, max: 44, grade: 'F', points: 0.0, remarks: 'Fail' },
  ];

  /**
   * Calculate percentage score from grade
   */
  static calculatePercentage(grade: Grade): number {
    if (grade.maxScore === 0) return 0;
    return Math.round((grade.score / grade.maxScore) * 100);
  }

  /**
   * Get letter grade and points based on percentage and curriculum
   */
  static getLetterGrade(percentage: number, curriculum: 'KE-CBC' | 'KE-8-4-4' | 'UG-UNEB' | 'TZ-NECTA' | 'RW-REB' | 'ET-NEAEA'): GradeResult {
    let scale: typeof GradingSystem.KENYA_GRADING_SCALE;

    switch (curriculum) {
      case 'KE-CBC':
      case 'KE-8-4-4':
        scale = GradingSystem.KENYA_GRADING_SCALE;
        break;
      case 'UG-UNEB':
        scale = GradingSystem.UGANDA_GRADING_SCALE;
        break;
      case 'TZ-NECTA':
        scale = GradingSystem.TANZANIA_GRADING_SCALE;
        break;
      case 'RW-REB':
      case 'ET-NEAEA':
      default:
        scale = GradingSystem.KENYA_GRADING_SCALE; // Default to Kenya system
        break;
    }

    const gradeEntry = scale.find(g => percentage >= g.min && percentage <= g.max);
    
    return {
      letterGrade: gradeEntry?.grade || 'E',
      gradePoints: gradeEntry?.points || 0,
      percentage,
      remarks: gradeEntry?.remarks || 'Fail',
    };
  }

  /**
   * Calculate weighted average for multiple grades
   */
  static calculateWeightedAverage(grades: Grade[]): number {
    if (grades.length === 0) return 0;

    const totalWeightedScore = grades.reduce((sum, grade) => sum + (grade.score * grade.weight), 0);
    const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);

    return totalWeight / totalWeight;
  }

  /**
   * Calculate GPA for a term/semester
   */
  static calculateGPA(grades: Grade[], curriculum: 'KE-CBC' | 'KE-8-4-4' | 'UG-UNEB' | 'TZ-NECTA' | 'RW-REB' | 'ET-NEAEA'): GPAData {
    if (grades.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        gradePoints: 0,
        classification: 'Fail',
      };
    }

    // Calculate total grade points and credits
    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach(grade => {
      const percentage = GradingSystem.calculatePercentage(grade);
      const gradeResult = GradingSystem.getLetterGrade(percentage, curriculum);
      
      // Assume each grade has 1 credit (can be enhanced with actual credit system)
      const credits = 1;
      
      totalPoints += gradeResult.gradePoints * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Classification based on GPA (Kenya system)
    let classification: GPAData['classification'];
    if (gpa >= 11) classification = 'First Class';
    else if (gpa >= 9) classification = 'Second Class Upper';
    else if (gpa >= 7) classification = 'Second Class Lower';
    else if (gpa >= 6) classification = 'Pass';
    else classification = 'Fail';

    return {
      gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
      totalCredits,
      gradePoints: totalPoints,
      classification,
    };
  }

  /**
   * Calculate class ranking position
   */
  static calculateClassRank(studentGPA: number, allGPAs: number[]): {
    rank: number;
    total: number;
    percentile: number;
  } {
    const sortedGPAs = [...allGPAs].sort((a, b) => b - a); // Descending order
    const rank = sortedGPAs.findIndex(gpa => gpa === studentGPA) + 1;
    const total = sortedGPAs.length;
    const percentile = Math.round(((total - rank) / total) * 100);

    return { rank, total, percentile };
  }

  /**
   * Generate grade distribution for a class
   */
  static generateGradeDistribution(grades: Grade[], curriculum: string): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    grades.forEach(grade => {
      const percentage = GradingSystem.calculatePercentage(grade);
      const gradeResult = GradingSystem.getLetterGrade(
        percentage, 
        curriculum as any
      );
      const letter = gradeResult.letterGrade;
      
      distribution[letter] = (distribution[letter] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate subject average for multiple terms
   */
  static calculateSubjectAverage(subjectGrades: Grade[]): {
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    trendPercentage: number;
  } {
    if (subjectGrades.length === 0) {
      return { average: 0, trend: 'stable', trendPercentage: 0 };
    }

    const sortedGrades = subjectGrades.sort((a, b) => {
      // Sort by some timestamp or term order (assuming we have term info)
      return 0; // Would need term data to calculate trend
    });

    const percentages = sortedGrades.map(g => GradingSystem.calculatePercentage(g));
    const average = percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length;

    // Simple trend calculation (compare first half to second half)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (percentages.length >= 4) {
      const firstHalf = percentages.slice(0, Math.floor(percentages.length / 2));
      const secondHalf = percentages.slice(Math.floor(percentages.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, pct) => sum + pct, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, pct) => sum + pct, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 2) {
        trend = 'improving';
        trendPercentage = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
      } else if (secondAvg < firstAvg - 2) {
        trend = 'declining';
        trendPercentage = Math.round(((firstAvg - secondAvg) / firstAvg) * 100);
      }
    }

    return { average: Math.round(average), trend, trendPercentage };
  }

  /**
   * Check if student passes based on minimum requirements
   */
  static checkPassStatus(grades: Grade[], curriculum: string, minimumPassPercentage: number = 50): {
    passes: boolean;
    averagePercentage: number;
    failedSubjects: string[];
  } {
    if (grades.length === 0) {
      return { passes: false, averagePercentage: 0, failedSubjects: [] };
    }

    const percentages = grades.map(g => GradingSystem.calculatePercentage(g));
    const averagePercentage = percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length;
    
    const failedSubjects: string[] = [];
    percentages.forEach((pct, index) => {
      if (pct < minimumPassPercentage) {
        failedSubjects.push(`Subject ${index + 1}`);
      }
    });

    return {
      passes: failedSubjects.length === 0 && averagePercentage >= minimumPassPercentage,
      averagePercentage: Math.round(averagePercentage),
      failedSubjects,
    };
  }

  /**
   * Generate academic performance report
   */
  static generatePerformanceReport(
    studentGrades: Record<string, Grade[]>, // Subject -> Grades array
    curriculum: 'KE-CBC' | 'KE-8-4-4' | 'UG-UNEB' | 'TZ-NECTA' | 'RW-REB' | 'ET-NEAEA'
  ): {
    overallGPA: GPAData;
    subjectResults: Record<string, {
      average: number;
      grade: GradeResult;
      rank?: number;
    }>;
    classStatistics: {
      totalStudents: number;
      averageGPA: number;
      gradeDistribution: Record<string, number>;
    };
  } {
    // Calculate overall GPA
    const allGrades = Object.values(studentGrades).flat();
    const overallGPA = GradingSystem.calculateGPA(allGrades, curriculum);

    // Calculate subject-specific results
    const subjectResults: Record<string, any> = {};
    Object.entries(studentGrades).forEach(([subject, grades]) => {
      const percentages = grades.map(g => GradingSystem.calculatePercentage(g));
      const averagePercentage = percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length;
      const gradeResult = GradingSystem.getLetterGrade(averagePercentage, curriculum);
      
      subjectResults[subject] = {
        average: Math.round(averagePercentage),
        grade: gradeResult,
      };
    });

    // Generate class statistics (would need class data for actual implementation)
    const classStatistics = {
      totalStudents: 0, // Would come from class data
      averageGPA: 0, // Would calculate from all students in class
      gradeDistribution: GradingSystem.generateGradeDistribution(allGrades, curriculum),
    };

    return {
      overallGPA,
      subjectResults,
      classStatistics,
    };
  }
}
