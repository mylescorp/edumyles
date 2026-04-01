import { test, expect } from './fixtures/auth.fixture';

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/finance');
  });

  test('should display payment statistics', async ({ page }) => {
    // Check if payment stats are displayed
    await expect(page.locator('text=Total Billed')).toBeVisible();
    await expect(page.locator('text=Total Collected')).toBeVisible();
    await expect(page.locator('text=Outstanding')).toBeVisible();
    await expect(page.locator('text=Collection Rate')).toBeVisible();
  });

  test('should initiate M-Pesa payment', async ({ page }) => {
    // Navigate to payments page
    await page.goto('/admin/payments');
    
    // Click on initiate payment
    await page.click('[data-testid="initiate-payment-btn"]');
    
    // Select M-Pesa as payment method
    await page.selectOption('[data-testid="payment-method"]', 'mpesa');
    
    // Fill in payment details
    await page.fill('[data-testid="student-search"]', 'John Doe');
    await page.waitForTimeout(1000); // Wait for search results
    await page.click('[data-testid="student-result-0"]');
    
    await page.fill('[data-testid="amount"]', '5000');
    await page.fill('[data-testid="phone"]', '0712345678');
    
    // Submit payment
    await page.click('[data-testid="submit-payment"]');
    
    // Check for success message
    await expect(page.locator('text=Payment initiated successfully')).toBeVisible();
  });

  test('should initiate Airtel Money payment', async ({ page }) => {
    await page.goto('/admin/payments');
    
    await page.click('[data-testid="initiate-payment-btn"]');
    await page.selectOption('[data-testid="payment-method"]', 'airtel');
    
    await page.fill('[data-testid="student-search"]', 'Jane Smith');
    await page.waitForTimeout(1000);
    await page.click('[data-testid="student-result-0"]');
    
    await page.fill('[data-testid="amount"]', '3000');
    await page.fill('[data-testid="phone"]', '0776543210');
    
    await page.click('[data-testid="submit-payment"]');
    
    await expect(page.locator('text=Payment initiated successfully')).toBeVisible();
  });

  test('should initiate Stripe payment', async ({ page }) => {
    await page.goto('/admin/payments');
    
    await page.click('[data-testid="initiate-payment-btn"]');
    await page.selectOption('[data-testid="payment-method"]', 'stripe');
    
    await page.fill('[data-testid="student-search"]', 'Bob Johnson');
    await page.waitForTimeout(1000);
    await page.click('[data-testid="student-result-0"]');
    
    await page.fill('[data-testid="amount"]', '10000');
    await page.fill('[data-testid="email"]', 'parent@example.com');
    
    await page.click('[data-testid="submit-payment"]');
    
    // Should redirect to Stripe or show checkout
    await expect(page.locator('text=Processing payment')).toBeVisible();
  });

  test('should handle payment webhook callbacks', async ({ page, request }) => {
    // Simulate M-Pesa webhook callback
    const webhookResponse = await request.post('/api/webhooks/mpesa', {
      data: {
        Body: {
          stkCallback: {
            MerchantRequestID: 'test-merchant-id',
            CheckoutRequestID: 'test-checkout-id',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: [
              { Item: { Name: 'Amount', Value: 5000 } },
              { Item: { Name: 'MpesaReceiptNumber', Value: 'ABC123XYZ' } },
              { Item: { Name: 'PhoneNumber', Value: '254712345678' } },
            ],
          },
        },
      },
    });

    expect(webhookResponse.status()).toBe(200);

    // Verify payment was recorded
    await page.goto('/admin/payments/history');
    await expect(page.locator('text=ABC123XYZ')).toBeVisible();
  });

  test('should display payment history', async ({ page }) => {
    await page.goto('/admin/payments/history');
    
    // Check if payment history table is displayed
    await expect(page.locator('[data-testid="payments-table"]')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Receipt')).toBeVisible();
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Method')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    
    // Check if there are payment records
    const paymentRows = page.locator('[data-testid="payment-row"]');
    const count = await paymentRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter payment history', async ({ page }) => {
    await page.goto('/admin/payments/history');
    
    // Filter by payment method
    await page.selectOption('[data-testid="filter-method"]', 'mpesa');
    await page.click('[data-testid="apply-filters"]');
    
    // Check if results are filtered
    const mpesaPayments = page.locator('[data-testid="payment-row"]:has-text("M-Pesa")');
    const count = await mpesaPayments.count();
    expect(count).toBeGreaterThan(0);
    
    // Filter by date range
    await page.fill('[data-testid="filter-date-from"]', '2024-01-01');
    await page.fill('[data-testid="filter-date-to"]', '2024-12-31');
    await page.click('[data-testid="apply-filters"]');
    
    // Check if date filter is applied
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible();
  });

  test('should export payment reports', async ({ page }) => {
    await page.goto('/admin/payments/history');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-payments"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/payments.*\.csv$/);
  });

  test('should handle payment refunds', async ({ page }) => {
    await page.goto('/admin/payments/history');
    
    // Find a completed payment
    const completedPayment = page.locator('[data-testid="payment-row"]:has-text("Completed")').first();
    await completedPayment.click();
    
    // Click refund button
    await page.click('[data-testid="refund-payment"]');
    
    // Fill refund details
    await page.fill('[data-testid="refund-amount"]', '1000');
    await page.fill('[data-testid="refund-reason"]', 'Student withdrawal');
    
    // Submit refund
    await page.click('[data-testid="submit-refund"]');
    
    // Check for success message
    await expect(page.locator('text=Refund processed successfully')).toBeVisible();
  });

  test('should display payment analytics', async ({ page }) => {
    await page.goto('/admin/payments/analytics');
    
    // Check analytics sections
    await expect(page.locator('text=Revenue Trends')).toBeVisible();
    await expect(page.locator('text=Payment Methods')).toBeVisible();
    await expect(page.locator('text=Collection Performance')).toBeVisible();
    
    // Check if charts are rendered
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-chart"]')).toBeVisible();
    
    // Check time period filters
    await page.selectOption('[data-testid="time-period"]', 'last-30-days');
    await page.waitForTimeout(1000);
    
    // Verify data is updated
    await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
  });
});
