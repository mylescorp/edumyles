"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Upload, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { toast } from "@/components/ui/use-toast";

// CSV template data
const generateCSVTemplate = () => {
    const headers = [
        "First Name",
        "Last Name", 
        "Date of Birth (YYYY-MM-DD)",
        "Gender (male/female/other)",
        "Class ID",
        "Admission Number",
        "Guardian Name",
        "Guardian Email",
        "Guardian Phone",
        "Guardian Relationship (father/mother/guardian/other)"
    ];
    
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
};

// Validate CSV data
const validateCSVData = (data: any[]) => {
    const errors: string[] = [];
    const requiredFields = ["First Name", "Last Name", "Date of Birth (YYYY-MM-DD)"];
    
    data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because header is row 1
        
        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === "") {
                errors.push(`Row ${rowNumber}: ${field} is required`);
            }
        });
        
        // Validate date format
        if (row["Date of Birth (YYYY-MM-DD)"]) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(row["Date of Birth (YYYY-MM-DD)"])) {
                errors.push(`Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD`);
            }
        }
        
        // Validate email format
        if (row["Guardian Email"] && row["Guardian Email"].trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row["Guardian Email"])) {
                errors.push(`Row ${rowNumber}: Invalid guardian email format`);
            }
        }
        
        // Validate phone format
        if (row["Guardian Phone"] && row["Guardian Phone"].trim()) {
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(row["Guardian Phone"].replace(/\s/g, ""))) {
                errors.push(`Row ${rowNumber}: Invalid phone number format`);
            }
        }
    });
    
    return errors;
};

// Parse CSV data
const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row");
    }
    
    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });
        
        data.push(row);
    }
    
    return data;
};

export default function BulkImportPage() {
    const { isLoading, sessionToken } = useAuth();
    const [importing, setImporting] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const createStudent = useMutation(api.modules.sis.mutations.createStudent);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        if (!file.name.endsWith(".csv")) {
            toast({
                title: "Error",
                description: "Please upload a CSV file",
                variant: "destructive"
            });
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({
                title: "Error",
                description: "File size should be less than 10MB",
                variant: "destructive"
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSV(text);
                const validationErrors = validateCSVData(data);
                
                if (validationErrors.length > 0) {
                    setErrors(validationErrors);
                    setCsvData([]);
                    setPreviewMode(false);
                } else {
                    setErrors([]);
                    setCsvData(data);
                    setPreviewMode(true);
                }
            } catch (err) {
                toast({
                    title: "Error",
                    description: err instanceof Error ? err.message : "Failed to parse CSV file",
                    variant: "destructive"
                });
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (csvData.length === 0) {
            toast({
                title: "Error",
                description: "No data to import",
                variant: "destructive"
            });
            return;
        }
        
        setImporting(true);
        setErrors([]);
        
        try {
            let successCount = 0;
            let failureCount = 0;
            const importErrors: string[] = [];
            
            for (let i = 0; i < csvData.length; i++) {
                const row = csvData[i];
                const rowNumber = i + 2; // +2 because header is row 1
                
                try {
                    // Generate admission number if not provided
                    const admissionNumber = row["Admission Number"] || 
                        `${new Date().getFullYear()}/ST/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                    
                    await createStudent({
                        firstName: row["First Name"]?.trim(),
                        lastName: row["Last Name"]?.trim(),
                        dateOfBirth: row["Date of Birth (YYYY-MM-DD)"],
                        gender: row["Gender (male/female/other)"]?.toLowerCase() || "other",
                        classId: row["Class ID"]?.trim() || undefined,
                        admissionNumber,
                        guardianName: row["Guardian Name"]?.trim() || undefined,
                        guardianEmail: row["Guardian Email"]?.trim() || undefined,
                        guardianPhone: row["Guardian Phone"]?.trim() || undefined,
                        guardianRelationship: row["Guardian Relationship (father/mother/guardian/other)"]?.toLowerCase() || "guardian",
                    });
                    
                    successCount++;
                } catch (err) {
                    failureCount++;
                    importErrors.push(`Row ${rowNumber}: ${err instanceof Error ? err.message : "Import failed"}`);
                }
            }
            
            if (failureCount === 0) {
                toast({
                    title: "Success",
                    description: `Successfully imported ${successCount} students`,
                });
                setCsvData([]);
                setPreviewMode(false);
            } else {
                toast({
                    title: "Partial Success",
                    description: `Imported ${successCount} students, ${failureCount} failed`,
                    variant: "destructive"
                });
                setErrors(importErrors);
            }
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Import failed",
                variant: "destructive"
            });
        } finally {
            setImporting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Students
                </Link>
            </div>

            <PageHeader
                title="Bulk Import Students"
                description="Import multiple students from a CSV file"
            />

            <div className="mt-6 space-y-6">
                {/* Template Download */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Step 1: Download Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Download the CSV template and fill it with student information. 
                            Required fields are marked with asterisks.
                        </p>
                        <Button onClick={generateCSVTemplate} variant="outline" className="w-full sm:w-auto">
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV Template
                        </Button>
                    </CardContent>
                </Card>

                {/* File Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Step 2: Upload CSV File
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="csvFile">CSV File</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose CSV File
                                </Button>
                            </div>
                            
                            {errors.length > 0 && (
                                <div className="rounded-md bg-destructive/10 p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-destructive">
                                                Validation Errors Found
                                            </p>
                                            <ul className="text-xs text-destructive mt-1 space-y-1">
                                                {errors.slice(0, 10).map((error, index) => (
                                                    <li key={index}>• {error}</li>
                                                ))}
                                                {errors.length > 10 && (
                                                    <li>• ... and {errors.length - 10} more errors</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Preview */}
                {previewMode && csvData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Preview ({csvData.length} students)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">First Name</th>
                                            <th className="text-left p-2">Last Name</th>
                                            <th className="text-left p-2">Date of Birth</th>
                                            <th className="text-left p-2">Gender</th>
                                            <th className="text-left p-2">Class</th>
                                            <th className="text-left p-2">Guardian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.slice(0, 5).map((row, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2">{row["First Name"]}</td>
                                                <td className="p-2">{row["Last Name"]}</td>
                                                <td className="p-2">{row["Date of Birth (YYYY-MM-DD)"]}</td>
                                                <td className="p-2">{row["Gender (male/female/other)"]}</td>
                                                <td className="p-2">{row["Class ID"]}</td>
                                                <td className="p-2">{row["Guardian Name"]}</td>
                                            </tr>
                                        ))}
                                        {csvData.length > 5 && (
                                            <tr>
                                                <td colSpan={6} className="p-2 text-center text-muted-foreground">
                                                    ... and {csvData.length - 5} more rows
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="flex gap-3 mt-4">
                                <Button
                                    onClick={handleImport}
                                    disabled={importing || errors.length > 0}
                                    className="flex-1"
                                >
                                    {importing ? "Importing..." : `Import ${csvData.length} Students`}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setCsvData([]);
                                        setPreviewMode(false);
                                        setErrors([]);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = "";
                                        }
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
