"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Briefcase, MapPin, GraduationCap } from "lucide-react";
import { getInitials } from "@/lib/formatters";

export default function AlumniDirectoryPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");

  const directory = useQuery(
    api.modules.portal.alumni.queries.getAlumniDirectory,
    sessionToken ? {} : "skip"
  );

  const alumniList = (directory ?? []) as any[];

  const years = useMemo(() => {
    const unique = [...new Set(alumniList.map((a) => String(a.graduationYear)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    return unique;
  }, [alumniList]);

  const programs = useMemo(() => {
    const unique = [...new Set(alumniList.map((a) => a.program).filter(Boolean))].sort();
    return unique;
  }, [alumniList]);

  const filtered = useMemo(() => {
    return alumniList.filter((a) => {
      const fullName = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
      const matchSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        (a.program ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.currentEmployer ?? "").toLowerCase().includes(search.toLowerCase());
      const matchYear = yearFilter === "all" || String(a.graduationYear) === yearFilter;
      const matchProgram = programFilter === "all" || a.program === programFilter;
      return matchSearch && matchYear && matchProgram;
    });
  }, [alumniList, search, yearFilter, programFilter]);

  if (isLoading || directory === undefined) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Directory"
        description={`Connect with ${alumniList.length} fellow alumni`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, program or employer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Graduation year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {alumniList.length} alumni
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">No alumni found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((alumni: any) => {
            const name = `${alumni.firstName ?? ""} ${alumni.lastName ?? ""}`.trim() || "Alumni";
            return (
              <Card key={alumni._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-semibold text-sm">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {alumni.graduationYear && (
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          Class of {alumni.graduationYear}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {alumni.program && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{alumni.program}</span>
                    </div>
                  )}

                  {(alumni.jobTitle || alumni.currentEmployer) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {alumni.jobTitle}
                        {alumni.jobTitle && alumni.currentEmployer ? " · " : ""}
                        {alumni.currentEmployer}
                      </span>
                    </div>
                  )}

                  {alumni.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{alumni.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
