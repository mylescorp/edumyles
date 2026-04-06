/**
 * Payment Webhook Handler Tests
 *
 * Tests the actual exported POST handlers from the webhook route files:
 *   - api/webhooks/mpesa/route.ts
 *   - api/webhooks/airtel/route.ts
 *
 * Strategy: mock convex/browser so ConvexHttpClient.action() is a spy,
 * then call the real handler with a crafted NextRequest-like object.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mock convex/browser before route handlers are imported ──────────────────
// The handlers create a ConvexHttpClient and call .action() on it.
// We replace the class with a factory that returns a controlled spy.

const mockConvexAction = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(
    function MockConvexHttpClient() {
      return {
        action: mockConvexAction,
      };
    }
  ),
}));

vi.mock('@/convex/_generated/api', () => ({
  api: {
    "modules/finance/actions": {
      recordPaymentFromGateway: "recordPaymentFromGateway",
    },
  },
}));

// ─── Import real handlers AFTER mock declarations ─────────────────────────────
import { POST as mpesaPost } from '@/app/api/webhooks/mpesa/route';
import { POST as airtelPost } from '@/app/api/webhooks/airtel/route';

// ─── Helper: build a minimal NextRequest-compatible object ───────────────────
function makeJsonRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: vi.fn((key: string) => headers[key.toLowerCase()] ?? null),
    },
  } as unknown as NextRequest;
}

// ═════════════════════════════════════════════════════════════════════════════
// M-Pesa webhook (api/webhooks/mpesa/route.ts)
// ═════════════════════════════════════════════════════════════════════════════

describe('M-Pesa Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3001';
    process.env.CONVEX_WEBHOOK_SECRET = 'test-mpesa-secret';
    mockConvexAction.mockResolvedValue({ success: true });
  });

  const successCallback = {
    Body: {
      stkCallback: {
        CheckoutRequestID: 'ws_CO_123456789',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 1000 },
            { Name: 'MpesaReceiptNumber', Value: 'LGR123456789' },
            { Name: 'TransactionDate', Value: '20240304120000' },
            { Name: 'PhoneNumber', Value: '+254700000000' },
          ],
        },
      },
    },
  };

  it('returns 200 and calls Convex action for a successful STK callback', async () => {
    const req = makeJsonRequest(successCallback);
    const res = await mpesaPost(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ResultCode).toBe(0);

    expect(mockConvexAction).toHaveBeenCalledOnce();
    const [, payload] = mockConvexAction.mock.calls[0];
    expect(payload).toMatchObject({
      webhookSecret: 'test-mpesa-secret',
      gateway: 'mpesa',
      externalId: 'ws_CO_123456789',
      resultCode: 0,
      reference: 'LGR123456789',
    });
  });

  it('records a failed payment (ResultCode 1032) without a receipt number', async () => {
    const failureCallback = {
      Body: {
        stkCallback: {
          CheckoutRequestID: 'ws_CO_987654321',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        },
      },
    };

    const req = makeJsonRequest(failureCallback);
    const res = await mpesaPost(req);

    expect(res.status).toBe(200);

    const [, payload] = mockConvexAction.mock.calls[0];
    expect(payload.resultCode).toBe(1032);
    expect(payload.externalId).toBe('ws_CO_987654321');
    // No MpesaReceiptNumber item → reference should be undefined
    expect(payload.reference).toBeUndefined();
  });

  it('returns 400 when stkCallback is missing', async () => {
    const malformed = { Body: {} };
    const req = makeJsonRequest(malformed);
    const res = await mpesaPost(req);

    expect(res.status).toBe(400);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });

  it('returns 400 when CheckoutRequestID is missing', async () => {
    const noId = {
      Body: {
        stkCallback: { ResultCode: 0, ResultDesc: 'Success' },
      },
    };
    const req = makeJsonRequest(noId);
    const res = await mpesaPost(req);

    expect(res.status).toBe(400);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });

  it('returns 500 when CONVEX_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.CONVEX_WEBHOOK_SECRET;

    const req = makeJsonRequest(successCallback);
    const res = await mpesaPost(req);

    expect(res.status).toBe(500);
    expect(mockConvexAction).not.toHaveBeenCalled();

    // Restore for other tests
    process.env.CONVEX_WEBHOOK_SECRET = 'test-mpesa-secret';
  });

  it('returns 200 (not 500) even when Convex action throws — M-Pesa requires 200 acks', async () => {
    mockConvexAction.mockRejectedValue(new Error('Convex unavailable'));

    const req = makeJsonRequest(successCallback);
    const res = await mpesaPost(req);

    // The handler catches errors and still returns 200 to satisfy M-Pesa's callback protocol
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ResultCode).toBe(1);
    expect(json.ResultDesc).toMatch(/Convex unavailable/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Airtel Money webhook (api/webhooks/airtel/route.ts)
// ═════════════════════════════════════════════════════════════════════════════

describe('Airtel Money Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3001';
    process.env.CONVEX_WEBHOOK_SECRET = 'test-airtel-secret';
    mockConvexAction.mockResolvedValue({ success: true });
  });

  const successPayload = {
    transactionId: 'ATL-TXN-001',
    status: 'SUCCESS',
    reference: 'SCH-REF-123',
    amount: '5000',
    currency: 'KES',
  };

  it('returns 200 and calls Convex action for a successful transaction', async () => {
    const req = makeJsonRequest(successPayload, {
      'x-webhook-secret': 'test-airtel-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(200);

    expect(mockConvexAction).toHaveBeenCalledOnce();
    const [, payload] = mockConvexAction.mock.calls[0];
    expect(payload).toMatchObject({
      gateway: 'airtel',
      externalId: 'ATL-TXN-001',
      resultCode: 0,
    });
  });

  it('returns 401 when the webhook secret header is missing', async () => {
    const req = makeJsonRequest(successPayload); // no secret header
    const res = await airtelPost(req);

    expect(res.status).toBe(401);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });

  it('returns 401 when the webhook secret header is wrong', async () => {
    const req = makeJsonRequest(successPayload, {
      'x-webhook-secret': 'wrong-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(401);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });

  it('returns 401 when CONVEX_WEBHOOK_SECRET env var is not set', async () => {
    delete process.env.CONVEX_WEBHOOK_SECRET;

    const req = makeJsonRequest(successPayload, {
      'x-webhook-secret': 'test-airtel-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(401);

    process.env.CONVEX_WEBHOOK_SECRET = 'test-airtel-secret';
  });

  it('returns 400 when no transaction identifier is present in the payload', async () => {
    const noId = { status: 'SUCCESS', amount: '100' }; // missing transactionId, externalId, reference
    const req = makeJsonRequest(noId, {
      'x-webhook-secret': 'test-airtel-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(400);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });

  it('maps status=FAILED to resultCode=1', async () => {
    const failedPayload = {
      transactionId: 'ATL-TXN-FAIL',
      status: 'FAILED',
      reference: 'SCH-REF-999',
    };
    const req = makeJsonRequest(failedPayload, {
      'x-webhook-secret': 'test-airtel-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(200);
    const [, payload] = mockConvexAction.mock.calls[0];
    expect(payload.resultCode).toBe(1);
  });

  it('accepts x-edumyles-webhook-secret as an alternative header name', async () => {
    const req = makeJsonRequest(successPayload, {
      'x-edumyles-webhook-secret': 'test-airtel-secret',
    });
    const res = await airtelPost(req);

    expect(res.status).toBe(200);
    expect(mockConvexAction).toHaveBeenCalledOnce();
  });
});
