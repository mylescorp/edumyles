import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Workflow execution engine
export const executeWorkflow = mutation({
  args: {
    sessionToken: v.string(),
    workflowId: v.string(),
    triggerData: v.optional(v.any()),
    manualTrigger: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    // Get workflow definition
    const workflow = await ctx.db
      .query("workflows")
      .filter((q) => q.eq(q.field("_id"), args.workflowId))
      .first();

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      throw new Error("Workflow is not active");
    }

    // Create workflow execution record
    const executionId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      workflowName: workflow.name,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "running" as const,
      startedAt: Date.now(),
      duration: 0,
      triggeredBy: args.manualTrigger ? session.userId : "system",
      triggerData: args.triggerData || {},
      steps: [],
      tenantId: session.tenantId,
    });

    try {
      // Execute workflow steps
      const executionResult = await executeWorkflowSteps(ctx, workflow, executionId, session);
      
      // Update execution record
      await ctx.db.patch(executionId, {
        status: executionResult.status as "running" | "completed" | "failed" | "cancelled",
        completedAt: Date.now(),
        duration: (Date.now() - executionResult.startedAt) / 1000 / 60 / 60, // Convert to hours
        steps: executionResult.steps,
        error: executionResult.error,
      });

      return {
        executionId,
        status: executionResult.status,
        steps: executionResult.steps,
        duration: executionResult.duration,
      };
    } catch (error: any) {
      // Update execution with error
      await ctx.db.patch(executionId, {
        status: "failed",
        completedAt: Date.now(),
        duration: (Date.now() - Date.now()) / 1000 / 60 / 60,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: Date.now(),
        },
      });

      throw error;
    }
  },
});

// Execute individual workflow steps
async function executeWorkflowSteps(ctx: any, workflow: any, executionId: any, session: any) {
  const steps = [];
  let currentStep = 0;

  for (const step of workflow.steps.sort((a: any, b: any) => a.position - b.position)) {
    const stepStartTime = Date.now();
    let stepResult: any = {
      id: step.id,
      name: step.name,
      type: step.type,
      status: "pending",
      startedAt: stepStartTime,
      completedAt: null,
      duration: 0,
      output: null,
      error: null,
    };

    try {
      stepResult.status = "running";
      
      // Execute step based on type
      switch (step.type) {
        case "action":
          stepResult.output = await executeActionStep(ctx, step, session, workflow.triggerData);
          break;
        case "condition":
          stepResult.output = await executeConditionStep(ctx, step, session, workflow.triggerData);
          break;
        case "notification":
          stepResult.output = await executeNotificationStep(ctx, step, session, workflow.triggerData);
          break;
        case "data_operation":
          stepResult.output = await executeDataOperationStep(ctx, step, session, workflow.triggerData);
          break;
        case "integration":
          stepResult.output = await executeIntegrationStep(ctx, step, session, workflow.triggerData);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepResult.status = "completed";
      stepResult.completedAt = Date.now();
      stepResult.duration = (stepResult.completedAt - stepStartTime) / 1000; // Convert to seconds

    } catch (error: any) {
      stepResult.status = "failed";
      stepResult.completedAt = Date.now();
      stepResult.duration = (stepResult.completedAt - stepStartTime) / 1000;
      stepResult.error = {
        message: error.message,
        timestamp: Date.now(),
      };

      // Stop execution on step failure
      steps.push(stepResult);
      break;
    }

    steps.push(stepResult);
    currentStep++;

    // Check if workflow should continue based on conditions
    if (step.type === "condition" && stepResult.output) {
      const condition = stepResult.output;
      if (condition.onFalse && currentStep < workflow.steps.length) {
        // Skip to the step specified in onFalse
        const nextStepIndex = workflow.steps.findIndex((s: any) => s.id === condition.onFalse);
        if (nextStepIndex !== -1) {
          currentStep = nextStepIndex;
        }
      }
    }
  }

  return {
    status: steps.every(s => s.status === "completed") ? "completed" : "failed",
    steps,
    startedAt: steps[0]?.startedAt || Date.now(),
    duration: steps.reduce((total: number, step: any) => total + (step.duration || 0), 0),
    error: steps.find(s => s.status === "failed")?.error || null,
  };
}

// Execute action steps
async function executeActionStep(ctx: any, step: any, session: any, triggerData: any) {
  const action = step.config.action;
  
  switch (action) {
    case "create_user":
      return await createUserAction(ctx, step.config.parameters, session, triggerData);
    case "assign_training":
      return await assignTrainingAction(ctx, step.config.parameters, session, triggerData);
    case "create_meeting":
      return await createMeetingAction(ctx, step.config.parameters, session, triggerData);
    case "create_tasks":
      return await createTasksAction(ctx, step.config.parameters, session, triggerData);
    case "send_email":
      return await sendEmailAction(ctx, step.config.parameters, session, triggerData);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Execute condition steps
async function executeConditionStep(ctx: any, step: any, session: any, triggerData: any) {
  const condition = step.config.condition;
  
  // Evaluate condition against trigger data and context
  let result = false;

  if (condition.includes("compliance_score >= 90")) {
    // Check actual compliance score from trigger data
    const score = triggerData?.compliance_score ?? triggerData?.score ?? 0;
    result = score >= 90;
  } else if (condition.includes("backup_verification.success")) {
    // Check actual backup status from trigger data
    result = triggerData?.backup_verification?.success === true || triggerData?.backupSuccess === true;
  } else if (condition.includes("documents_verified")) {
    // Check actual document verification status
    result = triggerData?.documents_verified === true || triggerData?.documentsVerified === true;
  } else {
    // Generic condition: check if the condition key exists and is truthy in trigger data
    const conditionKey = condition.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    result = !!triggerData?.[conditionKey];
  }

  return {
    condition,
    result,
    onTrue: step.config.on_true,
    onFalse: step.config.on_false,
  };
}

// Execute notification steps
async function executeNotificationStep(ctx: any, step: any, session: any, triggerData: any) {
  const recipients = step.config.recipients;
  const subject = step.config.subject;
  const template = step.config.template;

  // Create notification record
  const notificationId = await ctx.db.insert("notifications", {
    tenantId: session.tenantId,
    type: "workflow",
    title: subject,
    message: `Workflow notification: ${template}`,
    recipients,
    status: "sent",
    createdAt: Date.now(),
    createdBy: "workflow_system",
  });

  return {
    notificationId,
    recipients,
    subject,
    template,
    sentAt: Date.now(),
  };
}

// Execute data operation steps
async function executeDataOperationStep(ctx: any, step: any, session: any, triggerData: any) {
  const operation = step.config.operation;
  
  switch (operation) {
    case "generate_report":
      return await generateReport(ctx, step.config, session, triggerData);
    default:
      throw new Error(`Unknown data operation: ${operation}`);
  }
}

// Execute integration steps
async function executeIntegrationStep(ctx: any, step: any, session: any, triggerData: any) {
  const integration = step.config.integration;
  
  switch (integration) {
    case "database_backup":
      return await performDatabaseBackup(ctx, step.config, session, triggerData);
    case "cloud_storage":
      return await uploadToCloudStorage(ctx, step.config, session, triggerData);
    default:
      throw new Error(`Unknown integration: ${integration}`);
  }
}

// Action implementations
async function createUserAction(ctx: any, parameters: any, session: any, triggerData: any) {
  // Mock user creation - in production, this would create actual users
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    userId,
    role: parameters.role || "staff",
    email: parameters.email || `${userId}@edumyles.com`,
    welcomeEmailSent: parameters.send_welcome_email || false,
    createdAt: Date.now(),
  };
}

async function assignTrainingAction(ctx: any, parameters: any, session: any, triggerData: any) {
  // Mock training assignment
  const assignments = parameters.courses?.map((course: string) => ({
    courseId: course,
    assignedAt: Date.now(),
    dueDate: parameters.due_date || "30_days",
    status: "assigned",
  })) || [];

  return {
    coursesAssigned: assignments.length,
    trainingIds: parameters.courses || [],
    dueDate: parameters.due_date,
    assignments,
  };
}

async function createMeetingAction(ctx: any, parameters: any, session: any, triggerData: any) {
  // Mock meeting creation
  const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    meetingId,
    attendees: parameters.attendees || [],
    duration: parameters.duration || "1_hour",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    scheduled: true,
  };
}

async function createTasksAction(ctx: any, parameters: any, session: any, triggerData: any) {
  // Mock task creation
  const tasks = Array.from({ length: 3 }, (_, i) => ({
    taskId: `task_${Date.now()}_${i}`,
    title: `Task ${i + 1}`,
    priority: parameters.priority || "medium",
    assignee: parameters.assignee || "unassigned",
    dueDate: parameters.due_date || "7_days",
    status: "created",
  }));

  return {
    tasksCreated: tasks.length,
    tasks,
  };
}

async function sendEmailAction(ctx: any, parameters: any, session: any, triggerData: any) {
  // Mock email sending
  const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    emailId,
    to: parameters.to || [],
    subject: parameters.subject,
    template: parameters.template,
    sentAt: Date.now(),
    status: "sent",
  };
}

// Data operation implementations
async function generateReport(ctx: any, config: any, session: any, triggerData: any) {
  // Mock report generation
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    reportId,
    reportType: config.report_type,
    timeRange: config.time_range,
    generatedAt: Date.now(),
    status: "completed",
    downloadUrl: `https://edumyles.com/reports/${reportId}`,
  };
}

// Integration implementations
async function performDatabaseBackup(ctx: any, config: any, session: any, triggerData: any) {
  // Mock database backup
  const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    backupId,
    backupType: config.backup_type,
    compression: config.compression || false,
    startedAt: Date.now(),
    completedAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    status: "completed",
    size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1.1MB
  };
}

async function uploadToCloudStorage(ctx: any, config: any, session: any, triggerData: any) {
  // Mock cloud storage upload
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    uploadId,
    storageLocation: config.storage_location,
    encryption: config.encryption || false,
    uploadedAt: Date.now(),
    status: "completed",
    url: `https://storage.edumyles.com/${config.storage_location}/${uploadId}`,
  };
}

// Get workflow execution status
export const getWorkflowExecutionStatus = query({
  args: {
    sessionToken: v.string(),
    executionId: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);

    // Get execution record
    const execution = await ctx.db
      .query("workflowExecutions")
      .filter((q) => q.eq(q.field("executionId"), args.executionId))
      .first();

    if (!execution) {
      throw new Error("Execution not found");
    }

    return execution;
  },
});

// Cancel workflow execution
export const cancelWorkflowExecution = mutation({
  args: {
    sessionToken: v.string(),
    executionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    // Get execution record
    const execution = await ctx.db
      .query("workflowExecutions")
      .filter((q) => q.eq(q.field("executionId"), args.executionId))
      .first();

    if (!execution) {
      throw new Error("Execution not found");
    }

    if (execution.status !== "running") {
      throw new Error("Execution is not running");
    }

    // Update execution status
    await ctx.db.patch(execution._id, {
      status: "cancelled",
      completedAt: Date.now(),
      duration: (Date.now() - execution.startedAt) / 1000 / 60 / 60,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.cancelled",
      entityType: "workflow_execution",
      entityId: execution._id,
      before: { status: execution.status },
      after: { status: "cancelled" },
    });

    return {
      executionId: args.executionId,
      status: "cancelled",
      cancelledAt: Date.now(),
    };
  },
});

export const createWorkflow = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("onboarding"),
      v.literal("offboarding"),
      v.literal("compliance"),
      v.literal("security"),
      v.literal("communications"),
      v.literal("data_management"),
      v.literal("approval"),
      v.literal("notification"),
      v.literal("integration")
    ),
    trigger: v.union(
      v.literal("manual"),
      v.literal("scheduled"),
      v.literal("event_based"),
      v.literal("webhook")
    ),
    triggerConfig: v.optional(v.record(v.string(), v.any())),
    steps: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(
        v.literal("action"),
        v.literal("condition"),
        v.literal("approval"),
        v.literal("notification"),
        v.literal("delay"),
        v.literal("integration"),
        v.literal("data_operation")
      ),
      config: v.record(v.string(), v.any()),
      position: v.number(),
    })),
    isActive: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();
    const workflowId = await ctx.db.insert("workflows", {
      tenantId: "PLATFORM",
      name: args.name,
      description: args.description,
      category: args.category,
      trigger: args.trigger,
      triggerConfig: args.triggerConfig,
      steps: args.steps,
      isActive: args.isActive,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      successRate: 0,
      averageDuration: 0,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.created",
      entityType: "workflow",
      entityId: workflowId,
      after: { name: args.name, category: args.category, trigger: args.trigger },
    });

    return {
      success: true,
      workflowId,
      message: "Workflow created successfully",
    };
  },
});

export const triggerWorkflow = mutation({
  args: {
    sessionToken: v.string(),
    workflowId: v.string(),
    triggerData: v.optional(v.record(v.string(), v.any())),
    executionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);

    const workflow = await ctx.db.get(args.workflowId as any);
    if (!workflow) throw new Error("Workflow not found");

    const execId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const executionDocId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      workflowName: (workflow as any).name,
      executionId: execId,
      status: "running" as const,
      startedAt: Date.now(),
      duration: 0,
      triggeredBy: session.userId,
      triggerData: args.triggerData ?? {},
      steps: [],
      tenantId: session.tenantId,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.executed",
      entityType: "workflow_execution",
      entityId: executionDocId,
      after: { workflowId: args.workflowId, executionId: execId },
    });

    return {
      success: true,
      executionId: execId,
      executionDocId,
      status: "running",
      message: "Workflow execution started",
    };
  },
});

export const updateWorkflowStatus = mutation({
  args: {
    sessionToken: v.string(),
    workflowId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const workflow = await ctx.db.get(args.workflowId as any);
    if (!workflow) throw new Error("Workflow not found");
    const workflowDoc = workflow as any;

    await ctx.db.patch(args.workflowId as any, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.status_updated",
      entityType: "workflow",
      entityId: args.workflowId,
      before: { isActive: workflowDoc.isActive },
      after: { isActive: args.isActive },
    });

    return {
      success: true,
      message: `Workflow ${args.isActive ? "activated" : "deactivated"} successfully`,
    };
  },
});

export const createWorkflowTemplate = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    templateSteps: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      position: v.number(),
    })),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const now = Date.now();
    const templateId = await ctx.db.insert("workflowTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      templateSteps: args.templateSteps,
      isPublic: args.isPublic,
      tags: args.tags ?? [],
      usageCount: 0,
      rating: 0,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.template_created",
      entityType: "workflow_template",
      entityId: templateId,
      after: { name: args.name, category: args.category, isPublic: args.isPublic },
    });

    return {
      success: true,
      templateId,
      message: "Workflow template created successfully",
    };
  },
});

export const scheduleWorkflow = mutation({
  args: {
    sessionToken: v.string(),
    workflowId: v.string(),
    schedule: v.object({
      type: v.union(v.literal("once"), v.literal("recurring")),
      frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      timezone: v.string(),
    }),
    parameters: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    const workflow = await ctx.db.get(args.workflowId as any);
    if (!workflow) throw new Error("Workflow not found");

    await ctx.db.patch(args.workflowId as any, {
      trigger: "scheduled",
      triggerConfig: {
        schedule: JSON.stringify(args.schedule),
      },
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      actorEmail: session.email,
      action: "workflow.scheduled",
      entityType: "workflow",
      entityId: args.workflowId,
      after: { schedule: args.schedule },
    });

    const scheduleId = `schedule_${Date.now()}`;
    return {
      success: true,
      scheduleId,
      message: "Workflow scheduled successfully",
    };
  },
});

export const getWorkflowExecutionHistory = query({
  args: {
    sessionToken: v.string(),
    workflowId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const limit = args.limit ?? 20;
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(limit);
    return executions;
  },
});
