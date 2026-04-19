"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ParentJoinPage() {
  const params = useParams<{ schoolCode: string }>();
  const schoolCode = Array.isArray(params?.schoolCode) ? params.schoolCode[0] : params?.schoolCode;
  const schoolContext = useQuery(
    api.parentOnboarding.getJoinSchoolContext,
    schoolCode ? { schoolCode } : "skip"
  );

  const [identifier, setIdentifier] = useState("");
  const [submittedIdentifier, setSubmittedIdentifier] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [requestResult, setRequestResult] = useState<null | {
    maskedDestination: string;
    deliveryChannel: string;
    childCount: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedIdentifier = identifier.trim();
  const lookup = useQuery(
    api.parentOnboarding.lookupParentRegistration,
    schoolCode && submittedIdentifier
      ? { schoolCode, identifier: submittedIdentifier }
      : "skip"
  );

  const totalChildren = useMemo(
    () => (lookup?.matches ?? []).reduce((sum: number, match: any) => sum + (match.children?.length ?? 0), 0),
    [lookup]
  );

  async function handleFindChildren(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRequestResult(null);

    if (!trimmedIdentifier) {
      setError("Enter the phone number or email address the school has on file for you.");
      return;
    }

    setSubmittedIdentifier(trimmedIdentifier);
  }

  async function handleRequestOtp() {
    if (!schoolCode || !submittedIdentifier) return;

    setIsSendingOtp(true);
    setError(null);
    try {
      const response = await fetch("/api/parents/join/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          identifier: submittedIdentifier,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send verification code");
      }

      setRequestResult({
        maskedDestination: result.maskedDestination,
        deliveryChannel: result.deliveryChannel,
        childCount: result.childCount,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolCode || !submittedIdentifier) return;

    setIsVerifyingOtp(true);
    setError(null);
    try {
      const response = await fetch("/api/parents/join/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          identifier: submittedIdentifier,
          code: otpCode.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to verify code");
      }

      window.location.assign(result.redirectTo || "/portal/parent");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Failed to verify code");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,61,46,0.14),_transparent_34%),linear-gradient(180deg,_#f5faf7_0%,_#edf5ef_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Card className="border-emerald-100 bg-white/95 shadow-xl">
          <CardHeader className="space-y-4">
            <Badge variant="outline" className="w-fit border-emerald-200 text-emerald-900">
              Parent Access
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold text-slate-950">
                Join {schoolContext?.schoolName ?? "your school"} on EduMyles
              </CardTitle>
              <CardDescription className="max-w-2xl text-base text-slate-600">
                Confirm the email address or phone number the school has for you, then verify with a one-time code to enter the parent portal.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!schoolCode ? (
              <Alert>
                <AlertDescription>Invalid school link.</AlertDescription>
              </Alert>
            ) : null}

            {schoolCode && schoolContext === null ? (
              <Alert>
                <AlertDescription>We could not find that school code. Double-check the link from your school.</AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleFindChildren} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="identifier">Phone number or email</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="parent@example.com or +254700000000"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full md:w-auto">
                  Find My Children
                </Button>
              </div>
            </form>

            {submittedIdentifier && lookup && lookup.schoolFound && lookup.matches?.length ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-medium text-emerald-950">
                      We found {totalChildren} child record{totalChildren === 1 ? "" : "s"} linked to this contact.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {lookup.matches.map((match: any) => (
                      <div key={String(match.guardianId)} className="rounded-xl border border-emerald-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">{match.guardianName}</p>
                        <p className="mt-1 text-xs text-slate-500">{match.relationship}</p>
                        <div className="mt-3 space-y-2">
                          {match.children.map((child: any) => (
                            <div key={child.studentId} className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-sm font-medium text-slate-900">
                                {child.firstName} {child.lastName}
                              </p>
                              <p className="text-xs text-slate-500">
                                Admission No: {child.admissionNo || "Pending"} 
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!requestResult ? (
                    <Button onClick={handleRequestOtp} disabled={isSendingOtp} className="mt-4">
                      {isSendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Send Verification Code
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {submittedIdentifier && lookup && lookup.schoolFound && lookup.matches?.length === 0 ? (
              <Alert>
                <AlertDescription>
                  We found the school, but no parent record matches that contact yet. Ask the school admin to update your email or phone number first.
                </AlertDescription>
              </Alert>
            ) : null}

            {requestResult ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  {requestResult.deliveryChannel === "email" ? (
                    <Mail className="h-4 w-4 text-emerald-700" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-emerald-700" />
                  )}
                  <span>
                    Verification code sent to <strong>{requestResult.maskedDestination}</strong>.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otpCode">Enter the 6-digit code</Label>
                  <Input
                    id="otpCode"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                  />
                </div>
                <Button type="submit" disabled={isVerifyingOtp || otpCode.trim().length < 6}>
                  {isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify and Open Parent Portal
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
