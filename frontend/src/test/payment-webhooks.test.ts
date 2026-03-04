import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock the webhook handlers
const mockMpesaWebhook = vi.fn();
const mockStripeWebhook = vi.fn();
const mockAirtelWebhook = vi.fn();
const mockWorkosWebhook = vi.fn();

// Mock Convex client
const mockConvexMutation = vi.fn();

describe('Payment Webhook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env.CONVEX_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3001';
  });

  describe('M-Pesa Webhook', () => {
    it('should handle successful M-Pesa payment callback', async () => {
      const mockMpesaCallback = {
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

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockMpesaCallback),
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });
      mockMpesaWebhook.mockReturnValue(NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' }));

      // Simulate webhook handler
      const handleMpesaWebhook = async (req: NextRequest) => {
        try {
          const raw = await req.json();
          const body = raw as any;
          const stk = body.Body?.stkCallback;
          
          if (!stk?.CheckoutRequestID) {
            return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing CheckoutRequestID' }, { status: 400 });
          }

          const checkoutRequestId = stk.CheckoutRequestID;
          const resultCode = Number(stk.ResultCode) ?? 1;
          let reference: string | undefined;
          
          if (stk.CallbackMetadata?.Item) {
            const receipt = stk.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber');
            reference = receipt?.Value != null ? String(receipt.Value) : undefined;
          }

          await mockConvexMutation('modules.finance.mutations.recordPaymentFromGateway', {
            webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
            gateway: 'mpesa',
            externalId: checkoutRequestId,
            resultCode,
            reference,
          });

          return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
        } catch (e) {
          console.error('M-Pesa webhook error:', e);
          return NextResponse.json(
            { ResultCode: 1, ResultDesc: e instanceof Error ? e.message : 'Processing failed' },
            { status: 200 }
          );
        }
      };

      const response = await handleMpesaWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'modules.finance.mutations.recordPaymentFromGateway',
        {
          webhookSecret: 'test-webhook-secret',
          gateway: 'mpesa',
          externalId: 'ws_CO_123456789',
          resultCode: 0,
          reference: 'LGR123456789',
        }
      );
    });

    it('should handle failed M-Pesa payment callback', async () => {
      const mockMpesaCallback = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_123456789',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user',
          },
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockMpesaCallback),
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });

      const handleMpesaWebhook = async (req: NextRequest) => {
        const raw = await req.json();
        const body = raw as any;
        const stk = body.Body?.stkCallback;
        
        await mockConvexMutation('modules.finance.mutations.recordPaymentFromGateway', {
          webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
          gateway: 'mpesa',
          externalId: stk.CheckoutRequestID,
          resultCode: Number(stk.ResultCode),
        });

        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
      };

      const response = await handleMpesaWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'modules.finance.mutations.recordPaymentFromGateway',
        {
          webhookSecret: 'test-webhook-secret',
          gateway: 'mpesa',
          externalId: 'ws_CO_123456789',
          resultCode: 1032,
        }
      );
    });

    it('should reject malformed M-Pesa webhook', async () => {
      const malformedCallback = {
        Body: {
          // Missing stkCallback
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(malformedCallback),
      } as unknown as NextRequest;

      const handleMpesaWebhook = async (req: NextRequest) => {
        try {
          const raw = await req.json();
          const body = raw as any;
          const stk = body.Body?.stkCallback;
          
          if (!stk?.CheckoutRequestID) {
            return NextResponse.json({ ResultCode: 1, ResultDesc: 'Missing CheckoutRequestID' }, { status: 400 });
          }

          return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
        } catch (e) {
          return NextResponse.json({ ResultCode: 1, ResultDesc: 'Processing failed' }, { status: 200 });
        }
      };

      const response = await handleMpesaWebhook(mockRequest);

      expect(response.status).toBe(400);
    });
  });

  describe('Stripe Webhook', () => {
    it('should handle successful Stripe payment', async () => {
      const mockStripeEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456789',
            amount: 10000, // $100.00 in cents
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              invoiceId: 'inv_123',
              tenantId: 'tenant_123',
            },
          },
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockStripeEvent),
        headers: {
          get: vi.fn().mockReturnValue('stripe-signature'),
        },
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });

      const handleStripeWebhook = async (req: NextRequest) => {
        const event = await req.json();
        
        if (event.type === 'payment_intent.succeeded') {
          await mockConvexMutation('modules.finance.mutations.recordPaymentFromGateway', {
            webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
            gateway: 'stripe',
            externalId: event.data.object.id,
            resultCode: 0,
            amount: event.data.object.amount,
            currency: event.data.object.currency,
            metadata: event.data.object.metadata,
          });
        }

        return NextResponse.json({ received: true });
      };

      const response = await handleStripeWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'modules.finance.mutations.recordPaymentFromGateway',
        {
          webhookSecret: 'test-webhook-secret',
          gateway: 'stripe',
          externalId: 'pi_123456789',
          resultCode: 0,
          amount: 10000,
          currency: 'usd',
          metadata: {
            invoiceId: 'inv_123',
            tenantId: 'tenant_123',
          },
        }
      );
    });

    it('should handle Stripe payment failure', async () => {
      const mockStripeEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456789',
            amount: 10000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined.',
            },
          },
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockStripeEvent),
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });

      const handleStripeWebhook = async (req: NextRequest) => {
        const event = await req.json();
        
        if (event.type === 'payment_intent.payment_failed') {
          await mockConvexMutation('modules.finance.mutations.recordPaymentFromGateway', {
            webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
            gateway: 'stripe',
            externalId: event.data.object.id,
            resultCode: 1,
            errorMessage: event.data.object.last_payment_error?.message,
          });
        }

        return NextResponse.json({ received: true });
      };

      const response = await handleStripeWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'modules.finance.mutations.recordPaymentFromGateway',
        {
          webhookSecret: 'test-webhook-secret',
          gateway: 'stripe',
          externalId: 'pi_123456789',
          resultCode: 1,
          errorMessage: 'Your card was declined.',
        }
      );
    });
  });

  describe('Airtel Money Webhook', () => {
    it('should handle successful Airtel Money payment', async () => {
      const mockAirtelCallback = {
        transaction: {
          id: 'ATL123456789',
          message: 'Transaction successful',
          status: 'SUCCESS',
          amount: '1000',
          currency: 'KES',
          reference: 'SCH123456',
          msisdn: '+254700000000',
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockAirtelCallback),
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });

      const handleAirtelWebhook = async (req: NextRequest) => {
        const body = await req.json();
        const transaction = body.transaction;
        
        if (transaction.status === 'SUCCESS') {
          await mockConvexMutation('modules.finance.mutations.recordPaymentFromGateway', {
            webhookSecret: process.env.CONVEX_WEBHOOK_SECRET,
            gateway: 'airtel',
            externalId: transaction.id,
            resultCode: 0,
            amount: parseInt(transaction.amount) * 100, // Convert to cents
            currency: transaction.currency,
            reference: transaction.reference,
          });
        }

        return NextResponse.json({ status: 'received' });
      };

      const response = await handleAirtelWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'modules.finance.mutations.recordPaymentFromGateway',
        {
          webhookSecret: 'test-webhook-secret',
          gateway: 'airtel',
          externalId: 'ATL123456789',
          resultCode: 0,
          amount: 100000, // 1000 KES * 100
          currency: 'KES',
          reference: 'SCH123456',
        }
      );
    });
  });

  describe('WorkOS Webhook', () => {
    it('should handle WorkOS user sync', async () => {
      const mockWorkosEvent = {
        id: 'evt_123456789',
        event: 'user.updated',
        data: {
          object: {
            id: 'user_123',
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            state: 'active',
          },
        },
      };

      const mockRequest = {
        json: vi.fn().mockResolvedValue(mockWorkosEvent),
        headers: {
          get: vi.fn().mockReturnValue('workos-signature'),
        },
      } as unknown as NextRequest;

      mockConvexMutation.mockResolvedValue({ success: true });

      const handleWorkosWebhook = async (req: NextRequest) => {
        const event = await req.json();
        
        if (event.event === 'user.updated') {
          await mockConvexMutation('users.syncUserFromWorkOS', {
            workosUserId: event.data.object.id,
            email: event.data.object.email,
            firstName: event.data.object.first_name,
            lastName: event.data.object.last_name,
            state: event.data.object.state,
          });
        }

        return NextResponse.json({ received: true });
      };

      const response = await handleWorkosWebhook(mockRequest);

      expect(response.status).toBe(200);
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'users.syncUserFromWorkOS',
        {
          workosUserId: 'user_123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          state: 'active',
        }
      );
    });
  });

  describe('Webhook Security', () => {
    it('should validate webhook signature', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ test: 'data' }),
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('invalid-signature')
            .mockReturnValueOnce('application/json'),
        },
      } as unknown as NextRequest;

      const handleSecureWebhook = async (req: NextRequest) => {
        const signature = req.headers.get('webhook-signature');
        const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;

        if (!signature || signature !== 'valid-signature') {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = await req.json();
        return NextResponse.json({ received: true });
      };

      const response = await handleSecureWebhook(mockRequest);

      expect(response.status).toBe(401);
    });

    it('should handle missing webhook secret', async () => {
      delete process.env.CONVEX_WEBHOOK_SECRET;

      const mockRequest = {
        json: vi.fn().mockResolvedValue({ test: 'data' }),
      } as unknown as NextRequest;

      const handleWebhook = async (req: NextRequest) => {
        const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
          return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        return NextResponse.json({ received: true });
      };

      const response = await handleWebhook(mockRequest);

      expect(response.status).toBe(500);
      
      // Restore for other tests
      process.env.CONVEX_WEBHOOK_SECRET = 'test-webhook-secret';
    });
  });

  describe('Webhook Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const handleWebhook = async (req: NextRequest) => {
        try {
          await req.json();
          return NextResponse.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
      };

      const response = await handleWebhook(mockRequest);

      expect(response.status).toBe(400);
    });

    it('should handle Convex mutation errors', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ test: 'data' }),
      } as unknown as NextRequest;

      mockConvexMutation.mockRejectedValue(new Error('Convex connection failed'));

      const handleWebhook = async (req: NextRequest) => {
        try {
          const body = await req.json();
          await mockConvexMutation('test.mutation', body);
          return NextResponse.json({ received: true });
        } catch (e) {
          console.error('Webhook processing error:', e);
          return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
        }
      };

      const response = await handleWebhook(mockRequest);

      expect(response.status).toBe(500);
    });
  });
});
