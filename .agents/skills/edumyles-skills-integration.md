# EduMyles — Meta-Skills Analysis & Integration Guide
## April 2026

---

# SECTION 1 — SKILLS INVENTORY & RELEVANCE MATRIX

13 meta-skills were analysed against every system in the EduMyles platform. Below is a full relevance scorecard before the detailed integration plan for each applicable skill.

```
SKILL                 RELEVANCE    WHERE IT APPLIES IN EDUMYLES
────────────────────────────────────────────────────────────────────────────────
process-interviewer   ★★★★★        Planning new modules, spec sessions, feature scoping
mcp-builder           ★★★★★        M-Pesa, WorkOS, Africa's Talking, Resend MCP servers
openrouter            ★★★★★        AI grading assistant, smart fee engine, report generation
prompt-master         ★★★★☆        Optimising all 4 agent implementation prompts in specs
agent-browser         ★★★★☆        E2E testing all portals (school admin, parent, platform)
frontend-slides       ★★★★☆        School pitch decks, staff training, investor decks
humanizer             ★★★☆☆        All 16+ email templates in onboarding + platform specs
decision-toolkit      ★★★☆☆        Module selection wizard, plan comparison, tech decisions
deep-research         ★★★☆☆        Kenya education regulations, CBC curriculum, NHIF/NSSF
fact-checker          ★★★☆☆        Verifying VAT, NHIF, NSSF, PAYE compliance data
audio-transcriber     ★★☆☆☆        School meeting minutes, board recordings, demo call notes
file-organizer        ★★☆☆☆        Dev workspace hygiene, spec file organisation
find-skills           ★★☆☆☆        Meta — discovering more skills as platform grows
────────────────────────────────────────────────────────────────────────────────
```

---

# SECTION 2 — SKILL 1: PROCESS-INTERVIEWER

**Relevance: Critical (already partially referenced in specs)**

## 2.1 What It Does
A relentless interviewer that extracts a complete, unambiguous plan from a person's head before any building begins. It uses progressive, branch-resolving questioning to close every gap between intent and implementation.

## 2.2 Where It Applies in EduMyles

| Use Case | Phase | Value |
|---|---|---|
| Scoping a new marketplace module | Pre-build | Catches all edge cases before any code |
| Designing a new tenant flow | Pre-spec | Surfaces hidden requirements |
| Planning academic module (CBC, KCSE, etc.) | Pre-spec | School-type variations fully mapped |
| Building reseller commission structures | Pre-spec | Every calculation edge case surfaced |
| Adding a new payment provider | Pre-build | Integration quirks found early |
| Designing custom role system for a client | Pre-config | Permission conflicts found before rollout |

## 2.3 EduMyles-Specific Usage Triggers

Invoke this skill when:
- "I want to add [module]" — interview before writing spec
- "How should we handle [edge case]?" — interview before deciding
- "We need a reseller system" — interview to define tiers, commission, payout rules
- "Can we support CBC grading?" — interview to map all grading variants
- Any EduMyles module that touches money, compliance, or multi-tenant state

## 2.4 Integration into EduMyles Workflow

```
User: "I want to add a transport module to EduMyles"
      │
      ▼
process-interviewer activates:
  Phase 1: What is the actual goal?
    → Live GPS tracking? Route management? Parent notifications? Fee billing?
    → What do Kenyan schools actually need vs international features?
  
  Phase 2: Process deep-dive:
    → How are routes structured? (fixed routes vs dynamic?)
    → What vehicle types? (school bus, matatu, own vehicles?)
    → Who marks students as boarded? (driver? parent? teacher?)
    → How does transport fee tie into Finance module? (per term? per day?)
    → What happens if vehicle breaks down? (emergency notification flow)
    → GPS integration: which provider in Kenya? (Traccar? Google Maps?)
    → Parent tracking: push notification, SMS, or in-app only?
  
  Phase 3: Edge cases:
    → Student misses the bus — who is notified and when?
    → Vehicle changes route mid-term — how are fees adjusted?
    → Private students vs transport students — how tracked separately?
      │
      ▼
Output: Complete transport module spec
  → Passed directly to spec-writing agent
```

---

# SECTION 3 — SKILL 2: MCP-BUILDER

**Relevance: Critical — EduMyles needs multiple custom MCP servers**

## 3.1 What It Does
A comprehensive guide for building high-quality MCP (Model Context Protocol) servers in TypeScript or Python, covering tool design, error handling, authentication, and deployment.

## 3.2 The 5 MCP Servers EduMyles Needs

EduMyles depends on external APIs that agents constantly need to interact with. Each should become a proper MCP server so any agent working on the codebase can call them through Claude's MCP system directly.

### MCP Server 1: M-Pesa

```
Name: edumyles-mpesa-mcp
Purpose: Give agents direct access to M-Pesa Daraja API

Tools to implement:
  mpesa_stk_push(phone, amount, accountRef, description) → CheckoutRequestID
  mpesa_stk_query(checkoutRequestId) → { ResultCode, ResultDesc }
  mpesa_b2c_payment(phone, amount, remarks) → ConversationID
  mpesa_c2b_register_url(confirmUrl, validationUrl) → response
  mpesa_transaction_status(transactionId) → status details
  mpesa_account_balance() → { Balance, AccountType }
  mpesa_reverse_transaction(transactionId, amount, remarks) → response
  mpesa_generate_token() → { access_token, expires_in }
  mpesa_simulate_payment(phone, amount) → response  [SANDBOX ONLY]

Resources:
  mpesa://transactions/{limit}  → recent transactions
  mpesa://balance               → current balance

Authentication:
  Consumer Key + Consumer Secret → Bearer token (auto-refresh)
  Stored in env: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET
  MPESA_PAYBILL_NUMBER, MPESA_PASSKEY

Environments:
  MPESA_ENV=sandbox → https://sandbox.safaricom.co.ke
  MPESA_ENV=production → https://api.safaricom.co.ke
```

### MCP Server 2: WorkOS

```
Name: edumyles-workos-mcp
Purpose: Give agents WorkOS organization/user management without diving into HTTP

Tools to implement:
  workos_create_org(name, domains[]) → Organization
  workos_get_org(orgId) → Organization
  workos_delete_org(orgId) → void
  workos_create_user(email, firstName, lastName, password?) → User
  workos_get_user(userId) → User
  workos_update_user(userId, fields) → User
  workos_delete_user(userId) → void
  workos_send_verification_email(userId) → void
  workos_send_password_reset(email) → void
  workos_create_membership(userId, orgId, role) → Membership
  workos_delete_membership(membershipId) → void
  workos_list_memberships(orgId?, userId?) → Membership[]
  workos_send_invitation(email, orgId, role, redirectUri) → Invitation
  workos_revoke_invitation(invitationId) → void
  workos_get_authorization_url(orgId, redirectUri) → string
  workos_revoke_session(sessionId) → void

Resources:
  workos://org/{orgId}/members  → all org members
  workos://user/{userId}        → user details

Authentication:
  Env: WORKOS_API_KEY, WORKOS_CLIENT_ID, WORKOS_PLATFORM_ORG_ID
```

### MCP Server 3: Africa's Talking

```
Name: edumyles-africastalking-mcp
Purpose: SMS, USSD, and voice for Kenya + East Africa

Tools to implement:
  sms_send(recipients[], message, senderId?) → { SMSMessageData }
  sms_send_bulk(recipients[], message) → bulk result
  sms_fetch_messages(lastReceivedId?, direction?) → messages[]
  sms_fetch_subscriptions(shortCode, keyword) → subscriptions[]
  sms_create_subscription(phoneNumber, shortCode, keyword) → response
  airtime_send(recipients[], currencyCode, amount) → { responses }
  voice_call(callFrom, callTo) → response
  application_get_data() → { balance, credits }
  validate_phone_number(phoneNumber, countryCode?) → validity + carrier

Authentication:
  Env: AT_API_KEY, AT_USERNAME, AT_SHORTCODE
  Sandbox: AT_USERNAME=sandbox

Error handling:
  Network failures → retry with exponential backoff
  Invalid phone → clear error "Phone number [X] is not valid for [country]"
  Insufficient credits → alert with current balance
```

### MCP Server 4: Resend

```
Name: edumyles-resend-mcp
Purpose: Transactional email management for all EduMyles email flows

Tools to implement:
  email_send(from, to, subject, html, text?, tags?) → { id }
  email_batch_send(emails[]) → results[]
  email_get(emailId) → email details + delivery status
  email_cancel(emailId) → void
  domain_list() → domains[]
  domain_get(domainId) → domain details + DNS records
  domain_verify(domainId) → verification status
  audience_create(name) → audience
  audience_list() → audiences[]
  contact_create(audienceId, email, firstName?, lastName?) → contact
  contact_list(audienceId) → contacts[]
  broadcast_create(audienceId, from, subject, html) → broadcast
  broadcast_send(broadcastId) → void
  api_key_list() → api keys (names only, not values)

Resources:
  resend://domains          → all configured domains
  resend://audiences        → all email audiences
  resend://email/{id}       → email delivery status

Authentication:
  Env: RESEND_API_KEY
```

### MCP Server 5: Convex Admin

```
Name: edumyles-convex-mcp
Purpose: Give agents read access to Convex data for debugging, analytics, migration

Tools to implement:
  convex_query(functionPath, args) → result
  convex_mutation(functionPath, args) → result  [write-protected]
  convex_get_table_data(tableName, limit?, cursor?) → documents[]
  convex_count_table(tableName) → { count }
  convex_run_function(functionPath, args, type) → result
  convex_list_functions() → function catalog
  convex_get_logs(limit?, level?) → log entries

Note: Mutations require CONVEX_ADMIN_WRITE=true env flag for safety
Authentication:
  Env: CONVEX_URL, CONVEX_DEPLOY_KEY
```

## 3.3 MCP Server Development Pattern for EduMyles

Using the mcp-builder skill, follow this exact pattern for all EduMyles MCP servers:

```typescript
// Pattern: TypeScript + Streamable HTTP (for remote deployment)
// File: mcp-servers/[service-name]/src/index.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const server = new McpServer({
  name: "edumyles-[service]",
  version: "1.0.0",
  description: "[Service] integration for EduMyles platform",
});

// Tool naming convention: service_verb_noun
// e.g.: mpesa_stk_push, workos_create_user, sms_send

server.tool(
  "mpesa_stk_push",
  "Initiate M-Pesa STK push payment prompt to a customer's phone",
  {
    phone: z.string().describe("Customer phone number in format 254XXXXXXXXX"),
    amount: z.number().int().min(1).max(150000).describe("Amount in KES (1-150,000)"),
    accountRef: z.string().max(12).describe("Account reference (max 12 chars, e.g. admission number)"),
    description: z.string().max(13).describe("Transaction description (max 13 chars)"),
  },
  async ({ phone, amount, accountRef, description }) => {
    try {
      const token = await generateToken();
      const result = await mpesaSTKPush({ phone, amount, accountRef, description, token });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            checkoutRequestId: result.CheckoutRequestID,
            merchantRequestId: result.MerchantRequestID,
            responseDescription: result.ResponseDescription,
            message: `STK push sent to ${phone}. Customer will receive prompt to enter M-Pesa PIN.`,
          }),
        }],
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
            suggestion: error.code === "AUTH_FAILED"
              ? "Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET"
              : "Verify phone number format (254XXXXXXXXX) and amount (1-150,000 KES)",
          }),
        }],
        isError: true,
      };
    }
  }
);

// Deploy: mcp-servers/[service]/Dockerfile
// Registry: registered in .claude/mcp.json in the EduMyles monorepo
```

## 3.4 MCP Registration in EduMyles Monorepo

```json
// .claude/mcp.json  (at monorepo root)
{
  "mcpServers": {
    "edumyles-mpesa": {
      "command": "node",
      "args": ["./mcp-servers/mpesa/dist/index.js"],
      "env": {
        "MPESA_CONSUMER_KEY": "${MPESA_CONSUMER_KEY}",
        "MPESA_CONSUMER_SECRET": "${MPESA_CONSUMER_SECRET}",
        "MPESA_PAYBILL_NUMBER": "${MPESA_PAYBILL_NUMBER}",
        "MPESA_PASSKEY": "${MPESA_PASSKEY}",
        "MPESA_ENV": "${MPESA_ENV}"
      }
    },
    "edumyles-workos": {
      "command": "node",
      "args": ["./mcp-servers/workos/dist/index.js"],
      "env": {
        "WORKOS_API_KEY": "${WORKOS_API_KEY}",
        "WORKOS_CLIENT_ID": "${WORKOS_CLIENT_ID}",
        "WORKOS_PLATFORM_ORG_ID": "${WORKOS_PLATFORM_ORG_ID}"
      }
    },
    "edumyles-africastalking": {
      "command": "node",
      "args": ["./mcp-servers/africastalking/dist/index.js"],
      "env": {
        "AT_API_KEY": "${AT_API_KEY}",
        "AT_USERNAME": "${AT_USERNAME}"
      }
    },
    "edumyles-resend": {
      "command": "node",
      "args": ["./mcp-servers/resend/dist/index.js"],
      "env": { "RESEND_API_KEY": "${RESEND_API_KEY}" }
    },
    "edumyles-convex": {
      "command": "node",
      "args": ["./mcp-servers/convex/dist/index.js"],
      "env": {
        "CONVEX_URL": "${CONVEX_URL}",
        "CONVEX_DEPLOY_KEY": "${CONVEX_DEPLOY_KEY}"
      }
    }
  }
}
```

---

# SECTION 4 — SKILL 3: OPENROUTER

**Relevance: Critical — Powers AI features inside EduMyles**

## 4.1 What It Does
Provides unified access to 400+ AI models through one API, with intelligent routing, fallbacks, and standardised interfaces.

## 4.2 Where OpenRouter Powers EduMyles

EduMyles needs AI features that go beyond simple CRUD. OpenRouter enables all of them through the Anthropic Artifacts API pattern already in the codebase, but also as server-side Convex actions for backend AI processing.

### AI Feature 1: Smart Grade Analysis (Academics Module)

```typescript
// convex/modules/academics/ai/gradeAnalyzer.ts

export const analyzeStudentPerformance = internalAction({
  args: {
    studentId: v.string(),
    termId: v.string(),
    grades: v.array(v.object({
      subjectName: v.string(),
      marksAwarded: v.number(),
      totalMarks: v.number(),
      previousTermMark: v.optional(v.number()),
    })),
    attendanceRatePct: v.number(),
  },
  handler: async (ctx, args) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "EduMyles Grade Analyzer",
      },
      body: JSON.stringify({
        // Use Claude Haiku for cost efficiency on bulk analysis
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Analyse this student's academic performance for a Kenyan secondary school.
            
Grades: ${JSON.stringify(args.grades)}
Attendance rate: ${args.attendanceRatePct}%

Respond ONLY with valid JSON, no markdown:
{
  "overallTrend": "improving|declining|stable",
  "strongSubjects": ["subject1"],
  "weakSubjects": ["subject2"],
  "attendanceImpact": "high|medium|low|none",
  "teacherRecommendations": ["up to 3 specific, actionable suggestions"],
  "parentMessage": "A single encouraging sentence for the parent report card",
  "riskLevel": "at_risk|monitor|on_track|excelling"
}`,
        }],
      }),
    });

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }
});
```

### AI Feature 2: Fee Structure Recommendation Engine

```typescript
// convex/modules/finance/ai/feeAdvisor.ts

export const recommendFeeStructure = internalAction({
  args: {
    schoolType: v.string(),
    studentCount: v.number(),
    county: v.string(),
    boardingType: v.string(),
    levels: v.array(v.string()),
    currentFeesKes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use OpenRouter auto-routing for cost + quality balance
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `You are an expert in Kenyan school fee structures. 

School profile:
- Type: ${args.schoolType}
- Students: ${args.studentCount}
- County: ${args.county}
- Boarding: ${args.boardingType}
- Levels: ${args.levels.join(", ")}
- Current fees: ${args.currentFeesKes ? `KES ${args.currentFeesKes}/term` : "Not set"}

Based on 2025/2026 Kenyan school market rates, suggest a fee structure.
Consider: MoE guidelines, county cost of living, school type norms.

Respond ONLY with JSON (no markdown):
{
  "recommendedComponents": [
    { "name": "Tuition Fee", "amountKes": 15000, "mandatory": true, "rationale": "..." },
    { "name": "Activity Fee", "amountKes": 2000, "mandatory": true, "rationale": "..." }
  ],
  "totalTermKes": 17000,
  "totalAnnualKes": 51000,
  "benchmarkComparison": "above_average|average|below_average",
  "marketRangeKes": { "min": 12000, "max": 25000 },
  "notes": "Key considerations for this school profile"
}`,
        }],
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content.replace(/```json|```/g, "").trim());
  }
});
```

### AI Feature 3: Report Card Narrative Generator

```typescript
// convex/modules/academics/ai/reportNarrative.ts

export const generateReportCardNarrative = internalAction({
  args: {
    studentName: v.string(),
    className: v.string(),
    performanceData: v.string(),  // JSON of grades + behaviour
    schoolTerms: v.string(),      // "Term 1 2025"
    teacherNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Write a professional, encouraging report card narrative for a Kenyan school.

Student: ${args.studentName} | Class: ${args.className} | Term: ${args.schoolTerms}
Performance: ${args.performanceData}
Teacher notes: ${args.teacherNotes ?? "None"}

Write 3-4 sentences. Tone: professional, warm, specific (mention actual subjects).
Mention both strengths and ONE area for improvement.
End with an encouraging statement.
Write in third person. Return only the narrative text, no JSON, no labels.`,
        }],
      }),
    });

    return data.choices[0].message.content.trim();
  }
});
```

### AI Feature 4: Attendance Anomaly Detection

```typescript
// convex/modules/attendance/ai/anomalyDetector.ts

export const detectAttendanceAnomalies = internalAction({
  args: {
    classId: v.string(),
    weeklyData: v.string(),  // JSON: [{date, presentCount, absentCount, students[]}]
    historicalAvgPct: v.number(),
  },
  handler: async (ctx, args) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Analyse attendance data for a Kenyan school class and identify anomalies.

Weekly data: ${args.weeklyData}
Historical average: ${args.historicalAvgPct}%

Respond ONLY with JSON:
{
  "hasAnomaly": true,
  "anomalyType": "sudden_drop|gradual_decline|day_specific|none",
  "affectedDay": "Monday|Tuesday|...|null",
  "severity": "critical|warning|info",
  "probableCause": "national exam|public holiday|sporting event|illness_outbreak|unknown",
  "recommendedAction": "Single specific action for the school admin",
  "studentsToFollowUp": ["student IDs who have been absent 3+ consecutive days"]
}`,
        }],
      }),
    });

    return JSON.parse(data.choices[0].message.content.replace(/```json|```/g, "").trim());
  }
});
```

### AI Feature 5: Parent Communication Drafter (Communications Module)

```typescript
// convex/modules/communications/ai/messageDrafter.ts

export const draftParentMessage = internalAction({
  args: {
    messageType: v.string(), // "absence_alert", "fee_reminder", "event_notice", "emergency"
    studentName: v.string(),
    parentName: v.string(),
    schoolName: v.string(),
    contextData: v.string(),  // JSON of relevant data
    language: v.union(v.literal("en"), v.literal("sw")),
  },
  handler: async (ctx, args) => {
    const langInstruction = args.language === "sw"
      ? "Write in Swahili. Keep it respectful and clear."
      : "Write in English. Keep it professional and warm.";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Draft a short SMS/WhatsApp message for a Kenyan school parent.
${langInstruction}

Type: ${args.messageType}
Student: ${args.studentName} | Parent: ${args.parentName}
School: ${args.schoolName}
Data: ${args.contextData}

Rules: max 160 chars for SMS, professional but warm, include school name, no salutation.
Return ONLY the message text.`,
        }],
      }),
    });

    return { message: data.choices[0].message.content.trim() };
  }
});
```

## 4.3 OpenRouter Configuration for EduMyles

```typescript
// convex/lib/openrouter.ts — shared OpenRouter client

export async function callOpenRouter<T>(params: {
  prompt: string;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
  fallbackModels?: string[];
}): Promise<T> {
  const model = params.model ?? "anthropic/claude-haiku-4-5"; // cost-efficient default
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "EduMyles School Management",
      "HTTP-Referer": "https://edumyles.co.ke",
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 500,
      // Auto-fallback if primary model unavailable
      ...(params.fallbackModels?.length ? {
        models: [model, ...params.fallbackModels],
      } : {}),
      messages: [
        ...(params.systemPrompt ? [{
          role: "system" as const,
          content: params.systemPrompt,
        }] : []),
        { role: "user" as const, content: params.prompt },
      ],
      // JSON mode for structured outputs
      ...(params.jsonMode ? {
        response_format: { type: "json_object" },
      } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  if (params.jsonMode) {
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as T;
  }

  return content as T;
}

// Cost tracking — log to Convex for billing awareness
export async function callOpenRouterWithCostTracking<T>(
  ctx: ActionCtx,
  params: Parameters<typeof callOpenRouter>[0],
  context: { tenantId?: string; feature: string }
): Promise<T> {
  const result = await callOpenRouter<T>(params);
  
  // Log AI usage for cost attribution
  await ctx.runMutation(internal.ai.usage.logUsage, {
    tenantId: context.tenantId,
    feature: context.feature,
    model: params.model ?? "anthropic/claude-haiku-4-5",
    // Usage data available from OpenRouter response headers
    estimatedCostUsd: 0, // calculate from token counts
    createdAt: Date.now(),
  });

  return result;
}
```

```bash
# Environment variable required:
OPENROUTER_API_KEY=sk-or-v1-...

# Recommended model tiers for EduMyles:
# Bulk processing (grade analysis, anomaly detection): claude-haiku-4-5
# Narrative generation (report cards): claude-sonnet-4-6
# Complex reasoning (curriculum planning): claude-opus-4-6 (sparingly)
```

---

# SECTION 5 — SKILL 4: PROMPT-MASTER

**Relevance: High — All 4 EduMyles agent implementation prompts can be improved**

## 5.1 What It Does
Generates optimised prompts for any AI tool. Takes rough intent and outputs a single production-ready, zero-waste prompt.

## 5.2 Where to Apply in EduMyles

The 4 agent implementation prompts in the EduMyles spec suite are functional but contain several patterns the prompt-master skill would flag and optimise:

| Prompt File | Issues | Fix |
|---|---|---|
| `edumyles-marketplace-agent-prompt.md` | Verbose phase headers, redundant rule repetition | Compress phases, use structured XML tags |
| `edumyles-onboarding-agent-prompt.md` | Repetition of "read this first" in every phase | Single pre-flight block, reference not repeat |
| `edumyles-platform-agent-prompt.md` | Analysis prompt and implementation prompt mixed | Separate into Part A / Part B with clear delimiters |
| All prompts | No chain-of-thought for complex decisions | Add "Think step by step before writing any code" trigger |

## 5.3 How to Use Prompt-Master on EduMyles Prompts

```
Invoke prompt-master when:
- Writing a new agent implementation prompt for a module spec
- Optimising an existing phase prompt that produces inconsistent results
- Creating system prompts for the AI features in Section 4
- Writing prompts for OpenRouter AI feature calls

Example:
  Input to prompt-master: "I need a prompt for an agent that should 
    read the EduMyles marketplace spec, analyse the codebase, 
    and then implement missing functions in strict phase order"
    
  Target tool: Claude Code (coding agent)
  
  Prompt-master output: Optimised, structured prompt with:
  - Clear role definition
  - Constrained scope per phase
  - Verification gates between phases
  - Specific file paths referenced
  - Zero ambiguity about what "done" means per phase
```

## 5.4 Optimised System Prompt Template (for all EduMyles AI features)

```
You are an EduMyles school management AI assistant.

CONTEXT:
- Platform: EduMyles — multi-tenant school management SaaS for Kenya
- Data: All data comes from Convex queries — never fabricate student/school data
- Compliance: Kenya-specific — respect CBC, KCSE, NHIF, NSSF, PAYE rules
- Language: English or Swahili depending on school's language setting
- Tone: Professional, warm, direct — schools trust this system with real student data

RULES:
- Never invent student names, grades, or financial figures
- Always acknowledge uncertainty with "based on available data"
- Currency: KES only, no USD
- Dates: DD/MM/YYYY format

OUTPUT FORMAT: {{JSON_SCHEMA_HERE}}
```

---

# SECTION 6 — SKILL 5: AGENT-BROWSER

**Relevance: High — E2E testing of all EduMyles portals**

## 6.1 What It Does
Browser automation CLI using Chrome via CDP. Navigate, snapshot element refs, fill forms, click, screenshot, extract data — all scriptable.

## 6.2 EduMyles E2E Test Scenarios

```bash
# ─── TEST 1: School admin onboarding wizard ───────────────────────────────

agent-browser open https://localhost:3000/invite/accept?token=TEST_TOKEN
agent-browser snapshot -i
# @e1 = First Name input, @e2 = Last Name input, @e3 = Email, @e4 = Password

agent-browser fill @e1 "Alice"
agent-browser fill @e2 "Wanjiru"
agent-browser fill @e4 "SecurePass123!"
agent-browser click @e5  # "Create Account" button
agent-browser wait 3000
agent-browser screenshot --output screenshots/invite-accepted.png

# Verify redirect to setup wizard
agent-browser snapshot -i
# Should see: @e1 "School Profile" heading
agent-browser assert-text "@e1" "Tell us about your school"

# ─── TEST 2: Parent portal — fee payment via M-Pesa ──────────────────────

agent-browser --state ./auth/parent-session.json open https://test-school.edumyles.co.ke/portal/parent/fees
agent-browser snapshot -i
agent-browser click @e_pay_button  # Pay Now button on invoice
agent-browser wait 1000
agent-browser snapshot -i
agent-browser fill @e_phone "+254722123456"
agent-browser click @e_confirm
agent-browser wait 2000
agent-browser screenshot --output screenshots/mpesa-stk-initiated.png

# ─── TEST 3: Platform admin — invite staff member ─────────────────────────

agent-browser --state ./auth/platform-admin.json open https://platform.edumyles.co.ke/platform/users
agent-browser snapshot -i
agent-browser click "@e[text='Invite Staff']"
agent-browser wait 500
agent-browser snapshot -i
agent-browser fill "@e[label='Email Address']" "newstaff@edumyles.co.ke"
agent-browser fill "@e[label='First Name']" "James"
agent-browser fill "@e[label='Last Name']" "Mwangi"
agent-browser click "@e[text='Support Agent']"  # Role dropdown
agent-browser click "@e[text='Send Invitation Email']"
agent-browser wait 2000
agent-browser assert-text "@e[role=alert]" "Invitation sent"

# ─── TEST 4: Student CSV import ──────────────────────────────────────────

agent-browser --state ./auth/school-admin.json open https://test-school.edumyles.co.ke/admin/setup?step=8
agent-browser snapshot -i
agent-browser click "@e[text='Import from CSV']"
agent-browser upload "@e[type=file]" ./test-data/students-sample.csv
agent-browser wait 5000
agent-browser snapshot -i
agent-browser assert-text "@e[data-testid=import-count]" "447 students"

# ─── TEST 5: Marketplace module install ──────────────────────────────────

agent-browser --state ./auth/school-admin.json open https://test-school.edumyles.co.ke/admin/marketplace
agent-browser snapshot -i
agent-browser click "@e[data-module='mod_attendance']"
agent-browser wait 1000
agent-browser snapshot -i
agent-browser click "@e[text='Install & Try Free']"
agent-browser wait 2000
agent-browser assert-text "@e[data-testid=install-status]" "Installed"
```

## 6.3 CI/CD Integration

```bash
# scripts/e2e-test.sh — run in CI after every deployment

#!/bin/bash
set -e

echo "Starting EduMyles E2E tests..."

# Install agent-browser if not present
if ! command -v agent-browser &> /dev/null; then
  npm install -g agent-browser && agent-browser install
fi

# Set up test environment
export TEST_URL="https://staging.edumyles.co.ke"
export ADMIN_EMAIL="test-admin@edumyles-test.co.ke"

# Run all test suites
agent-browser open $TEST_URL/health && echo "✅ Health check passed"

# Run wizard flow test
bash scripts/tests/wizard-flow.sh && echo "✅ Wizard flow passed"

# Run marketplace test
bash scripts/tests/marketplace-install.sh && echo "✅ Marketplace install passed"

# Run parent portal test
bash scripts/tests/parent-portal.sh && echo "✅ Parent portal passed"

echo "All E2E tests passed! ✅"
```

## 6.4 Screenshot Regression Testing

```bash
# Compare portal screenshots between deployments for visual regression

agent-browser open https://staging.edumyles.co.ke/admin
agent-browser screenshot --output screenshots/admin-dashboard-new.png

# Compare with baseline
diff screenshots/admin-dashboard-baseline.png screenshots/admin-dashboard-new.png \
  && echo "No visual changes" || echo "⚠️  Visual differences detected"
```

---

# SECTION 7 — SKILL 6: FRONTEND-SLIDES

**Relevance: High — Multiple EduMyles presentation needs**

## 7.1 What It Does
Creates zero-dependency, animation-rich HTML presentations. Single self-contained file, viewport-safe, distinctive design.

## 7.2 Where EduMyles Needs Presentations

| Presentation | Audience | Content |
|---|---|---|
| School Sales Pitch Deck | Prospective schools | Why EduMyles, key features, pricing, testimonials |
| Investor Deck | VCs / Angel investors | TAM, traction, team, roadmap, financials |
| Staff Onboarding Slides | New EduMyles team members | Company values, tech stack, onboarding steps |
| Module Feature Release | Existing schools | New module showcase, benefits, how to install |
| Parent Portal Tutorial | School parents | How to register, pay fees, check grades |
| Platform Admin Training | Internal team | How to use platform admin, CRM, PM |
| Conference Presentation | EdTech conferences | EduMyles story, impact, Kenya education data |

## 7.3 Quick-Launch Template for EduMyles Decks

```
Invoke frontend-slides when:
- "Create a pitch deck for EduMyles"
- "Build a slide deck to present to schools at the Nairobi EdTech Forum"
- "Make a parent onboarding tutorial presentation"
- "Create a module release announcement presentation"

EduMyles brand variables to inject into slides:
  Primary color: #0070F3
  Secondary: #1B4F72
  Accent: #22c55e (success green)
  Font stack: Inter, system-ui
  Logo: /logo.svg (white version for dark backgrounds)
  Tagline: "The school management platform built for Kenya"
```

---

# SECTION 8 — SKILL 7: HUMANIZER

**Relevance: Medium-High — All 16+ EduMyles email templates**

## 8.1 What It Does
Removes AI writing patterns from text (em-dash overuse, rule of three, vague attributions, sycophantic openers, inflated vocabulary) and injects actual personality.

## 8.2 Current EduMyles Email Templates That Need Humanising

Every email template in the onboarding spec was written functionally — they communicate correctly but read like AI wrote them. Run humanizer on all:

| Template | Key Problem | Fix |
|---|---|---|
| `tenant_invite` | "We're excited to have you join…" — sycophantic opener | Start with the value directly |
| `waitlist_confirmation` | Bullet list of features feels like a product tour | Conversational 2-3 sentences |
| `tenant_welcome` | "Step 1, Step 2, Step 3" structure is robotic | Feels like an IKEA manual |
| `trial_day7_halfway` | "You're halfway through your trial" — obvious statement | Start with what they've achieved so far |
| `trial_expired` | Overly formal, too much "your data" reassurance | More direct, less anxiety-inducing |
| `staff_invite` | Generic corporate | Should sound like a warm personal invite from a colleague |
| `subscription_confirmed` | Receipt-style only | Should feel like a celebration, not a bank statement |

## 8.3 Humanizer Application Pattern for EduMyles

```
For each email template:

1. Copy the raw template text from the spec
2. Invoke humanizer with target tone:
   - Invitation emails: warm, personal, like a colleague reaching out
   - Billing emails: clear, factual, no anxiety-inducing language
   - Alert emails: urgent but not alarming
   - Welcome emails: celebratory, specific to their school name/context
   - Expiry emails: direct, solution-focused, not guilt-tripping

3. Specific patterns to fix in EduMyles emails:
   - Remove all "We're excited to…" openers
   - Remove all em dashes (—) — replace with commas or full stops
   - Remove "seamless", "robust", "leverage", "solution", "empower"
   - Remove rule-of-three bullet structures from body copy
   - Ensure every email has ONE clear call-to-action, not three
   - Add a genuine signature with actual person name, not "The EduMyles Team"
```

## 8.4 Before/After Example

**Before (from spec — AI-written):**
```
Subject: Your EduMyles invitation is ready, Alice 🎉

Hi Alice,

You've been invited to join EduMyles — Kenya's leading school management platform.

As the admin for Nairobi Academy, you'll be able to:
✓ Manage all students, staff, and classes
✓ Process fee payments via M-Pesa, Airtel, and Card
✓ Track attendance and share grades with parents
✓ Run payroll with automatic NHIF, NSSF & PAYE calculations
✓ And much more with 15+ modules in the marketplace
```

**After (humanized):**
```
Subject: Nairobi Academy's account is ready — let's get started

Hi Alice,

Your school is set up and waiting for you. One click and you're in.

James from our team set up your account after reviewing your application — 
he's pre-configured the modules we think will serve Nairobi Academy best 
(Finance, Attendance, and Parent Portal to start).

Your 14-day trial starts the moment you finish setting up. No card needed.
```

---

# SECTION 9 — SKILL 8: DECISION-TOOLKIT

**Relevance: Medium — School-facing decision tools + internal EduMyles decisions**

## 9.1 What It Does
Generates structured decision support tools — interactive HTML dashboards, bias checkers, scenario explorers, weighted matrices.

## 9.2 Where Decision-Toolkit Applies in EduMyles

### Use 1: Module Selection Wizard for Schools

```
When a school admin visits /admin/marketplace and is overwhelmed by 15 modules:
→ "Help me choose" button triggers a decision-toolkit flow
→ 5 questions about their biggest pain points
→ Returns: recommended modules ranked by ROI for their school profile
→ Shows: decision guide with rationale, cost breakdown, suggested order
```

Invoke decision-toolkit to build this interactive wizard as an HTML artifact.

### Use 2: Plan Upgrade Decision Guide

```
When trial_expired, show a decision-toolkit-powered plan comparison:
→ "Which plan is right for us?" button
→ Interactive questions: How many modules do you use? How many staff? Budget per month?
→ Shows: weighted matrix comparing Free/Starter/Pro/Enterprise
→ Highlights which plan saves the most money given their actual usage
```

### Use 3: Internal EduMyles Decisions

```
Tech stack decisions: "Should we add Kafka or keep the Convex event bus?"
→ Run decision-toolkit with: complexity, cost, scale requirements, team expertise
→ Output: weighted decision guide that documents the reasoning

Pricing decisions: "Should we add a new plan tier?"
→ Run decision-toolkit to map out: market positioning, revenue impact, support burden
→ Output: decision export document saved to /platform/docs
```

---

# SECTION 10 — SKILL 9: DEEP-RESEARCH

**Relevance: Medium — Kenya-specific compliance and education data**

## 10.1 What It Does
Runs comprehensive internet-enabled research using OpenAI's deep research model. Returns structured reports with sources.

## 10.2 Where Deep-Research Powers EduMyles

```
Research needed before building specific EduMyles features:

1. NHIF/NSSF/PAYE rates verification
   Query: "Current Kenya NHIF, NSSF, and PAYE rates 2025-2026 for payroll"
   Output: Verified rate tables for HR module
   
2. CBC curriculum structure
   Query: "Kenya CBC curriculum structure 2025 — grade levels, subjects, 
           assessment methods, EE/ME/AE/BE grading"
   Output: Complete grading structure for academics module
   
3. Kenya school fee norms by county
   Query: "Average school fee ranges for secondary schools in Nairobi, 
           Mombasa, Kisumu, Nakuru Kenya 2025"
   Output: Benchmarks for fee structure recommendations
   
4. NEMIS integration requirements
   Query: "Kenya NEMIS API integration requirements 2025 — endpoints, 
           data format, authentication"
   Output: Integration spec for NEMIS reporting module
   
5. M-Pesa STK push limits and rules
   Query: "Safaricom M-Pesa STK push daily transaction limits, 
           bulk payment rules, reversal policy Kenya 2025"
   Output: Compliance rules for payment module
   
6. Kenya Data Protection Act compliance
   Query: "Kenya Data Protection Act 2019 requirements for SaaS platforms 
           storing student data — consent, retention, rights"
   Output: Compliance checklist for platform legal review
```

## 10.3 Running Deep-Research for EduMyles

```
Trigger: When spec-writing needs verified compliance data

Pattern:
  1. Identify the compliance/regulatory question
  2. Invoke deep-research with specific Kenya context
  3. Save output to docs/research/[topic]-[date].md in the monorepo
  4. Reference in relevant module spec
  5. Schedule quarterly re-runs (regulations change)

Example workflow:
  deep-research: "What are the current NHIF contribution rates for 
  Kenyan employees and employers as of 2025, including the new 
  SHA contributions replacing NHIF?"
  
  Output saved to: docs/research/nhif-sha-rates-2025.md
  Referenced in: edumyles-master-spec.md (HR module payroll section)
```

---

# SECTION 11 — SKILL 10: FACT-CHECKER

**Relevance: Medium — Verifying Kenya-specific compliance data in specs**

## 11.1 What It Does
Systematic fact verification using evidence-based analysis. Rates claims and provides authoritative sources.

## 11.2 Where Fact-Checker Applies

```
Facts in the EduMyles spec that must be verified before implementation:

FINANCIAL:
  ✓ "VAT rate: 16%" → Verify: Kenya VAT Act, current KRA rate
  ✓ "NHIF contribution: X% of gross" → Verify: NHIF Act, current SHA rates
  ✓ "NSSF: KES 200 employee, KES 200 employer (old tier)" → Verify: 2023 NSSF Act
  ✓ "PAYE brackets: up to KES 288,000 tax-free" → Verify: KRA PAYE rates 2025
  ✓ "M-Pesa transaction limit: KES 150,000/day" → Verify: Safaricom current limits

EDUCATION:
  ✓ "CBC levels: Grade 1-6 (Primary), Grade 7-9 (JSS), Grade 10-12 (SSS)"
  ✓ "KCSE grading: A=80+, A-=75-79, B+=70-74..." → Verify: KNEC current scheme
  ✓ "MoE registration number format: MoE/SEC/YYYY/NNN" → Verify actual format

LEGAL:
  ✓ "Schools must retain student records for 7 years" → Verify: Kenya law
  ✓ "Schools processing personal data must register with ODPC" → Verify: DPA 2019
```

## 11.3 Fact-Check Protocol for EduMyles

```
Run fact-checker before finalising any spec that contains:
- Tax rates or statutory deduction amounts
- Regulatory requirements or compliance thresholds
- Payment provider limits (M-Pesa, Airtel, bank)
- Education ministry requirements (NEMIS, KNEC)
- Data protection obligations

Output: Fact-check report saved to docs/compliance/fact-check-[date].md
Red-flagged items: Must be verified by a Kenya-based legal/accounting contact
  before implementation
```

---

# SECTION 12 — SKILL 11: AUDIO-TRANSCRIBER

**Relevance: Low-Medium — School meetings and EduMyles internal use**

## 12.1 What It Does
Transcribes audio files to structured Markdown using Faster-Whisper, with meeting minutes, speaker diarisation, and executive summaries.

## 12.2 Where It Applies in EduMyles

```
INTERNAL EDUMYLES USE:
  - Transcribe product planning meeting recordings → structured spec input
  - Transcribe school demo calls → CRM activity notes auto-populated
  - Transcribe investor call recordings → follow-up action items
  
SCHOOL-FACING FEATURE (future module idea):
  mod_board_meetings — school board/PTA meeting transcription
    → Upload recording → auto-generate minutes → share with stakeholders
    → Powered by audio-transcriber skill + OpenRouter narrative cleanup
    → Store in Convex, searchable
    
CRM INTEGRATION (near-term):
  When a sales call is recorded:
  → Drag audio file to CRM lead → auto-transcribe
  → Auto-generate: call summary, action items, next follow-up
  → Auto-log as "call" activity with body = transcript summary
  
Platform Manager workflow:
  "Transcribe my school demo call with Nairobi Academy from today"
  → audio-transcriber runs on the recording file
  → Structured output pasted into CRM activity log
  → Next follow-up auto-set based on detected action items
```

---

# SECTION 13 — IMPLEMENTATION PLAN: ADDING ALL SKILLS TO EDUMYLES

---

## 13.1 Folder Structure

```
edumyles/
├── .agent-skills/                       ← All skills go here
│   ├── process-interviewer/
│   │   └── SKILL.md                     ← Copied from meta-skills
│   ├── mcp-builder/
│   │   ├── SKILL.md
│   │   └── reference/
│   ├── openrouter/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── prompt-master/
│   │   └── SKILL.md
│   ├── agent-browser/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── frontend-slides/
│   │   ├── SKILL.md
│   │   └── STYLE_PRESETS.md
│   ├── humanizer/
│   │   └── SKILL.md
│   ├── decision-toolkit/
│   │   ├── SKILL.md
│   │   └── templates/
│   ├── deep-research/
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── fact-checker/
│   │   └── SKILL.md
│   └── audio-transcriber/
│       ├── SKILL.md
│       └── scripts/
│
├── mcp-servers/                         ← New: MCP server implementations
│   ├── mpesa/
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── workos/
│   │   ├── src/index.ts
│   │   └── package.json
│   ├── africastalking/
│   │   ├── src/index.ts
│   │   └── package.json
│   ├── resend/
│   │   ├── src/index.ts
│   │   └── package.json
│   └── convex/
│       ├── src/index.ts
│       └── package.json
│
├── .claude/
│   └── mcp.json                         ← MCP server registry
│
├── convex/
│   └── lib/
│       └── openrouter.ts                ← Shared OpenRouter client
│
└── docs/
    ├── research/                        ← deep-research outputs
    └── compliance/                      ← fact-checker outputs
```

## 13.2 Priority Order for Adding Skills

```
WEEK 1 — Critical path (blocks other work):
  1. mcp-builder → Build 5 MCP servers (mpesa, workos, africastalking, resend, convex)
  2. openrouter → Add shared client + 5 AI feature actions to Convex

WEEK 2 — Quality improvement:
  3. humanizer → Rewrite all 16 email templates
  4. prompt-master → Optimise all 4 agent implementation prompts
  5. fact-checker → Verify all compliance data in specs

WEEK 3 — Testing and presentation:
  6. agent-browser → Write E2E test suite for all 5 portals
  7. frontend-slides → Create school sales pitch deck + parent tutorial

ONGOING — Research and decisions:
  8. deep-research → Quarterly Kenya compliance research runs
  9. decision-toolkit → Build module selection wizard
  10. process-interviewer → Use before every new module spec
  11. audio-transcriber → Integrate into CRM call logging
```

## 13.3 Skills Already in EduMyles (Confirmed)

From the existing skill references in the spec system prompt, these are already present:

```
/mnt/skills/user/process-interviewer/SKILL.md   ← Already added ✅
/mnt/skills/user/frontend-slides/SKILL.md        ← Already added ✅
```

These need to be **added from the uploaded zip**:

```
mcp-builder          → Not yet in .agent-skills/
openrouter           → Not yet in .agent-skills/
prompt-master        → Not yet in .agent-skills/
agent-browser        → Not yet in .agent-skills/
humanizer            → Not yet in .agent-skills/
decision-toolkit     → Not yet in .agent-skills/
deep-research        → Not yet in .agent-skills/
fact-checker         → Not yet in .agent-skills/
audio-transcriber    → Not yet in .agent-skills/
file-organizer       → Not yet in .agent-skills/ (low priority)
find-skills          → Not yet in .agent-skills/ (meta, low priority)
```

---

# SECTION 14 — EDUMYLES-SPECIFIC SKILL TRIGGER GUIDE

This is the master reference for WHEN to invoke each skill during EduMyles development:

```
TRIGGER: "I want to build [new module]"
  → ALWAYS run: process-interviewer FIRST
  → THEN run: prompt-master on the resulting implementation prompt
  → THEN write: full module spec

TRIGGER: "I need to integrate [M-Pesa / WorkOS / Resend / AT]"
  → ALWAYS run: mcp-builder to create the MCP server FIRST
  → Register in .claude/mcp.json
  → Then use the MCP server in Convex actions

TRIGGER: "Add AI to [feature]"
  → ALWAYS use: openrouter with callOpenRouter() helper
  → Model choice: haiku for bulk, sonnet for narratives, opus sparingly
  → Always return JSON for Convex storage

TRIGGER: "Test [portal / flow / integration]"
  → ALWAYS use: agent-browser for automated E2E testing
  → Save screenshots to screenshots/ folder
  → Add to CI/CD pipeline

TRIGGER: "Create a presentation for [schools / investors / staff]"
  → ALWAYS use: frontend-slides
  → Brand: #0070F3, Inter font, logo from /logo.svg

TRIGGER: "Write an email for [invitation / alert / confirmation]"
  → Draft functional email first
  → THEN run: humanizer to remove AI patterns
  → Target tone: warm, direct, Kenya-appropriate

TRIGGER: "Is [NHIF rate / VAT / M-Pesa limit] correct in the spec?"
  → Run: fact-checker on the specific claim
  → Run: deep-research if current data needed
  → Document in docs/compliance/

TRIGGER: "Should we [add a feature / change pricing / pick a tech]?"
  → Run: decision-toolkit to build a structured decision guide
  → Document the decision in docs/decisions/

TRIGGER: "Transcribe [demo call / meeting recording]"
  → Run: audio-transcriber on the audio file
  → Paste structured output into CRM activity / meeting notes

TRIGGER: "Write an agent prompt for [implementation phase]"
  → Run: prompt-master with target tool = Claude Code
  → Zero wasted tokens, single production-ready prompt block
```

---

*End of EduMyles Meta-Skills Analysis & Integration Guide*
*13 skills analysed | 5 critical | 5 high | 3 medium | April 2026*
