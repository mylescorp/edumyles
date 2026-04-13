import { ConvexError, v } from "convex/values";
import { internalAction, internalMutation, internalQuery, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireModuleAccess } from "./helpers/moduleGuard";
import * as financeHandlers from "./modules/finance/eventHandlers";
import * as libraryHandlers from "./modules/library/eventHandlers";
import * as communicationsHandlers from "./modules/communications/eventHandlers";
import * as ewalletHandlers from "./modules/ewallet/eventHandlers";
import * as timetableHandlers from "./modules/timetable/eventHandlers";
import * as alumniHandlers from "./modules/alumni/eventHandlers";

type EventBusMutationCtx = MutationCtx;

const EVENT_HANDLER_REFERENCES: Record<string, any> = {
  "modules.finance.eventHandlers.onStudentEnrolled": financeHandlers.onStudentEnrolled,
  "modules.finance.eventHandlers.onLibraryBookOverdue": financeHandlers.onLibraryBookOverdue,
  "modules.library.eventHandlers.onFinanceInvoiceOverdue": libraryHandlers.onFinanceInvoiceOverdue,
  "modules.library.eventHandlers.onFinancePaymentReceived": libraryHandlers.onFinancePaymentReceived,
  "modules.communications.eventHandlers.onAttendanceStudentAbsent":
    communicationsHandlers.onAttendanceStudentAbsent,
  "modules.communications.eventHandlers.onAttendanceStudentConsecutive":
    communicationsHandlers.onAttendanceStudentConsecutive,
  "modules.communications.eventHandlers.onAcademicsGradePosted":
    communicationsHandlers.onAcademicsGradePosted,
  "modules.communications.eventHandlers.onAcademicsExamResultsPublished":
    communicationsHandlers.onAcademicsExamResultsPublished,
  "modules.communications.eventHandlers.onFinanceInvoiceCreated":
    communicationsHandlers.onFinanceInvoiceCreated,
  "modules.communications.eventHandlers.onFinanceInvoiceOverdue":
    communicationsHandlers.onFinanceInvoiceOverdue,
  "modules.communications.eventHandlers.onFinancePaymentReceived":
    communicationsHandlers.onFinancePaymentReceived,
  "modules.ewallet.eventHandlers.onFinancePaymentReceived":
    ewalletHandlers.onFinancePaymentReceived,
  "modules.timetable.eventHandlers.onHrLeaveApproved": timetableHandlers.onHrLeaveApproved,
  "modules.alumni.eventHandlers.onStudentGraduated": alumniHandlers.onStudentGraduated,
};

async function getEventSubscribers(ctx: EventBusMutationCtx, eventType: string, tenantId: string) {
  return await ctx.db
    .query("module_event_subscriptions")
    .withIndex("by_eventType_tenantId", (q) =>
      q.eq("eventType", eventType).eq("tenantId", tenantId)
    )
    .collect();
}

function getHandlerReference(handlerFunctionName: string) {
  return EVENT_HANDLER_REFERENCES[handlerFunctionName] ?? null;
}

export async function publishEvent<T>(
  ctx: EventBusMutationCtx,
  args: {
    eventType: string;
    publisherModule: string;
    tenantId: string;
    payload: T;
    correlationId?: string;
    causationId?: string;
  }
) {
  await requireModuleAccess(ctx, args.publisherModule, args.tenantId);

  const eventId = await ctx.db.insert("module_events", {
    eventType: args.eventType,
    publisherModule: args.publisherModule,
    tenantId: args.tenantId,
    payload: JSON.stringify(args.payload),
    publishedAt: Date.now(),
    processingStatus: "pending",
    retryCount: 0,
    subscriberResults: [],
    correlationId: args.correlationId,
    causationId: args.causationId,
  });

  await ctx.scheduler.runAfter(0, internal.eventBus.dispatchEvent, { eventId });

  return eventId;
}

export const dispatchEvent = internalMutation({
  args: {
    eventId: v.id("module_events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Event not found" });
    }

    await ctx.db.patch(args.eventId, {
      processingStatus: "processing",
    });

    try {
      const subscriptions = (await getEventSubscribers(ctx, event.eventType, event.tenantId)).filter(
        (subscription) => subscription.isActive
      );

      const subscriberResults: Array<{
        subscriberModule: string;
        status: string;
        processedAt: number;
        error?: string;
      }> = [];

      for (const subscription of subscriptions) {
        const handlerReference = getHandlerReference(subscription.handlerFunctionName);
        if (!handlerReference) {
          subscriberResults.push({
            subscriberModule: subscription.subscriberModule,
            status: "missing_handler",
            processedAt: Date.now(),
            error: `No handler reference registered for '${subscription.handlerFunctionName}'`,
          });
          continue;
        }

        await ctx.scheduler.runAfter(0, handlerReference, {
          eventId: event._id,
          eventType: event.eventType,
          tenantId: event.tenantId,
          payload: event.payload,
          correlationId: event.correlationId,
          causationId: event.causationId,
        });

        subscriberResults.push({
          subscriberModule: subscription.subscriberModule,
          status: "scheduled",
          processedAt: Date.now(),
        });
      }

      await ctx.db.patch(args.eventId, {
        processingStatus: "completed",
        subscriberResults,
      });
    } catch (error) {
      await ctx.db.patch(args.eventId, {
        processingStatus: "failed",
        retryCount: event.retryCount + 1,
        lastRetryAt: Date.now(),
      });

      throw error;
    }
  },
});

export const retryFailedEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const failedEvents = await ctx.db
      .query("module_events")
      .withIndex("by_processingStatus", (q) => q.eq("processingStatus", "failed"))
      .collect();

    for (const event of failedEvents) {
      if (event.retryCount >= 3) {
        await ctx.db.patch(event._id, {
          processingStatus: "dead_letter",
          lastRetryAt: Date.now(),
        });
        await ctx.scheduler.runAfter(0, internal.eventBus.sendDeadLetterAlert, {
          eventId: event._id,
        });
        continue;
      }

      await ctx.scheduler.runAfter(0, internal.eventBus.dispatchEvent, { eventId: event._id });
    }
  },
});

export const sendDeadLetterAlert = internalAction({
  args: {
    eventId: v.id("module_events"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ delivered: boolean; reason?: string; status?: number }> => {
    const event: any = await ctx.runQuery((internal as any).eventBus.getEventForAlert, {
      eventId: args.eventId,
    });
    if (!event) {
      return { delivered: false, reason: "event_not_found" };
    }

    const settings: { webhookUrl?: string } = await ctx.runQuery(
      (internal as any).eventBus.getSlackWebhookSetting,
      {}
    );
    if (!settings?.webhookUrl) {
      return { delivered: false, reason: "webhook_not_configured" };
    }

    const response: Response = await fetch(settings.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `EduMyles event bus dead letter: ${event.eventType} for tenant ${event.tenantId}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `*Dead letter event detected*\n` +
                `*Event:* ${event.eventType}\n` +
                `*Publisher:* ${event.publisherModule}\n` +
                `*Tenant:* ${event.tenantId}\n` +
                `*Retries:* ${event.retryCount}`,
            },
          },
        ],
      }),
    });

    return {
      delivered: response.ok,
      status: response.status,
    };
  },
});

export const getEventForAlert = internalQuery({
  args: {
    eventId: v.id("module_events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const getSlackWebhookSetting = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_section_key", (q) =>
        q.eq("section", "marketplace").eq("key", "slack_dead_letter_webhook")
      )
      .unique();

    if (settings?.value) {
      return { webhookUrl: settings.value };
    }

    const fallback = await ctx.db
      .query("platformSettings")
      .withIndex("by_section_key", (q) =>
        q.eq("section", "integrations").eq("key", "slack_webhook_url")
      )
      .unique();

    return { webhookUrl: fallback?.value };
  },
});
