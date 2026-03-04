"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Briefcase, MapPin } from "lucide-react";

export default function AlumniDirectoryPage() {
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState<string>("");

    const directory = useQuery(api.modules.portal.alumni.queries.getAlumniDirectory, {
        search: search || undefined,
        graduationYear: yearFilter ? parseInt(yearFilter) : undefined,
    });

    // Generate a range of years for the filter
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alumni Directory"
                description="Connect with fellow alumni from your school."
            />

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, employer, or program..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Graduation Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Years</SelectItem>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {directory && directory.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {directory.map((alumnus) => (
                        <Card key={alumnus._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {(alumnus.firstName?.[0] ?? "").toUpperCase()}
                                            {(alumnus.lastName?.[0] ?? "").toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">
                                            {alumnus.firstName} {alumnus.lastName}
                                        </h3>
                                        <Badge variant="outline" className="mt-1">
                                            Class of {alumnus.graduationYear}
                                        </Badge>

                                        {alumnus.program && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {alumnus.program}
                                            </p>
                                        )}

                                        {(alumnus.jobTitle || alumnus.currentEmployer) && (
                                            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                                                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate">
                                                    {alumnus.jobTitle}
                                                    {alumnus.jobTitle && alumnus.currentEmployer && " at "}
                                                    {alumnus.currentEmployer}
                                                </span>
                                            </div>
                                        )}

                                        {alumnus.linkedIn && (
                                            <a
                                                href={alumnus.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block text-sm text-primary hover:underline mt-2"
                                            >
                                                LinkedIn Profile →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            {search || yearFilter
                                ? "No alumni match your search criteria."
                                : "No alumni registered yet."}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
