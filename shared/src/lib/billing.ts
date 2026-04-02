// ============================================================
// EduMyles — Subscription Billing Engine
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'starter' | 'standard' | 'pro' | 'enterprise';
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  maxUsers: number;
  maxStudents: number;
  maxStorage: number; // GB
  supportLevel: 'basic' | 'priority' | 'premium';
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface UsageMetrics {
  activeUsers: number;
  totalStudents: number;
  storageUsed: number; // GB
  apiCalls: number;
  bandwidthUsed: number; // GB
  period: 'current' | 'last_month';
}

export class BillingEngine {
  private static readonly PLANS: SubscriptionPlan[] = [
    {
      id: 'starter-monthly',
      name: 'Starter',
      tier: 'starter',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: 'USD',
      features: [
        'Up to 50 students',
        'Basic SIS features',
        'Email support',
        '5GB storage',
      ],
      maxUsers: 3,
      maxStudents: 50,
      maxStorage: 5,
      supportLevel: 'basic',
    },
    {
      id: 'standard-monthly',
      name: 'Standard',
      tier: 'standard',
      monthlyPrice: 79.99,
      yearlyPrice: 799.99,
      currency: 'USD',
      features: [
        'Up to 200 students',
        'Full SIS + Academics',
        'Priority email support',
        '20GB storage',
        'Basic analytics',
      ],
      maxUsers: 10,
      maxStudents: 200,
      maxStorage: 20,
      supportLevel: 'priority',
    },
    {
      id: 'pro-monthly',
      name: 'Professional',
      tier: 'pro',
      monthlyPrice: 199.99,
      yearlyPrice: 1999.99,
      currency: 'USD',
      features: [
        'Up to 500 students',
        'All modules included',
        'Priority support 24/7',
        '50GB storage',
        'Advanced analytics',
        'API access',
      ],
      maxUsers: 25,
      maxStudents: 500,
      maxStorage: 50,
      supportLevel: 'premium',
    },
    {
      id: 'enterprise-monthly',
      name: 'Enterprise',
      tier: 'enterprise',
      monthlyPrice: 499.99,
      yearlyPrice: 4999.99,
      currency: 'USD',
      features: [
        'Unlimited students',
        'All features + custom',
        'Dedicated support manager',
        'Unlimited storage',
        'White-label options',
        'SLA guarantee',
      ],
      maxUsers: -1, // Unlimited
      maxStudents: -1, // Unlimited
      maxStorage: -1, // Unlimited
      supportLevel: 'premium',
    },
  ];

  /**
   * Get all available plans
   */
  static getPlans(): SubscriptionPlan[] {
    return this.PLANS;
  }

  /**
   * Get plan by ID
   */
  static getPlanById(planId: string): SubscriptionPlan | null {
    return this.PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Calculate prorated amount for mid-cycle changes
   */
  static calculateProratedAmount(
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
    daysInPeriod: number,
    daysRemaining: number
  ): number {
    const dailyRate = billingCycle === 'monthly' 
      ? plan.monthlyPrice / daysInPeriod
      : plan.yearlyPrice / daysInPeriod;
    
    return Math.round(dailyRate * daysRemaining * 100) / 100;
  }

  /**
   * Calculate next billing date
   */
  static calculateNextBillingDate(
    currentPeriodEnd: Date,
    billingCycle: 'monthly' | 'yearly'
  ): Date {
    const nextDate = new Date(currentPeriodEnd);
    
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return nextDate;
  }

  /**
   * Check if subscription is active
   */
  static isSubscriptionActive(subscription: Subscription): boolean {
    return subscription.status === 'active' || subscription.status === 'trial';
  }

  /**
   * Check if subscription needs payment
   */
  static isSubscriptionPastDue(subscription: Subscription): boolean {
    return subscription.status === 'past_due';
  }

  /**
   * Calculate usage-based overage charges
   */
  static calculateOverageCharges(
    usage: UsageMetrics,
    plan: SubscriptionPlan
  ): {
    userOverage: number;
    studentOverage: number;
    storageOverage: number;
    totalOverage: number;
  } {
    let userOverage = 0;
    let studentOverage = 0;
    let storageOverage = 0;

    // User overage
    if (plan.maxUsers > 0 && usage.activeUsers > plan.maxUsers) {
      userOverage = (usage.activeUsers - plan.maxUsers) * 9.99; // $9.99 per extra user
    }

    // Student overage
    if (plan.maxStudents > 0 && usage.totalStudents > plan.maxStudents) {
      studentOverage = (usage.totalStudents - plan.maxStudents) * 0.99; // $0.99 per extra student
    }

    // Storage overage
    if (plan.maxStorage > 0 && usage.storageUsed > plan.maxStorage) {
      storageOverage = (usage.storageUsed - plan.maxStorage) * 2.99; // $2.99 per extra GB
    }

    const totalOverage = userOverage + studentOverage + storageOverage;

    return {
      userOverage,
      studentOverage,
      storageOverage,
      totalOverage,
    };
  }

  /**
   * Generate invoice for subscription
   */
  static generateSubscriptionInvoice(
    subscription: Subscription,
    plan: SubscriptionPlan,
    overageCharges: number = 0
  ): BillingInvoice {
    const basePrice = subscription.billingCycle === 'monthly' 
      ? plan.monthlyPrice 
      : plan.yearlyPrice;

    const items: InvoiceItem[] = [
      {
        description: `${plan.name} Plan (${subscription.billingCycle})`,
        quantity: 1,
        unitPrice: basePrice,
        amount: basePrice,
      },
    ];

    // Add overage charges if any
    if (overageCharges > 0) {
      items.push({
        description: 'Usage Overage Charges',
        quantity: 1,
        unitPrice: overageCharges,
        amount: overageCharges,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.16; // 16% VAT (Kenya)
    const total = subtotal + tax;

    return {
      id: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      status: 'pending',
      items,
      subtotal,
      tax,
      total,
      currency: plan.currency,
      dueDate: subscription.nextBillingDate,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate MRR and ARR for reporting
   */
  static calculateRecurringRevenue(
    subscriptions: Subscription[]
  ): {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    activeSubscriptions: number;
    churnRate: number;
  } {
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === 'active' || sub.status === 'trial'
    );

    const mrr = activeSubscriptions.reduce((total, sub) => {
      const plan = this.getPlanById(sub.planId);
      if (!plan) return total;
      
      const monthlyAmount = sub.billingCycle === 'monthly' 
        ? plan.monthlyPrice 
        : plan.yearlyPrice / 12;
      
      return total + monthlyAmount;
    }, 0);

    const arr = mrr * 12;
    
    // Calculate churn rate (simplified)
    const totalSubscriptions = subscriptions.length;
    const cancelledSubscriptions = subscriptions.filter(sub => 
      sub.status === 'cancelled'
    ).length;
    
    const churnRate = totalSubscriptions > 0 
      ? (cancelledSubscriptions / totalSubscriptions) * 100 
      : 0;

    return {
      mrr,
      arr,
      activeSubscriptions: activeSubscriptions.length,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  }

  /**
   * Get plan recommendations based on usage
   */
  static recommendPlan(
    usage: UsageMetrics,
    currentPlanId?: string
  ): {
    recommendedPlan: SubscriptionPlan | null;
    reason: string;
    savings?: number;
  } {
    const currentPlan = currentPlanId ? this.getPlanById(currentPlanId) : null;
    
    let recommendedPlan: SubscriptionPlan | null = this.PLANS[0] ?? null;
    let reason = 'Based on your current usage';

    // Recommend based on student count
    if (usage.totalStudents > 200) {
      recommendedPlan = this.PLANS.find(p => p.tier === 'enterprise') || null;
      reason = 'Your student count exceeds Standard plan limits';
    } else if (usage.totalStudents > 50) {
      recommendedPlan = this.PLANS.find(p => p.tier === 'pro') || null;
      reason = 'Your student count exceeds Standard plan limits';
    }

    // Check storage usage
    if (usage.storageUsed > 20) {
      recommendedPlan = this.PLANS.find(p => p.tier === 'pro') || null;
      reason = 'Your storage usage exceeds Standard plan limits';
    }

    // Calculate potential savings
    let savings: number | undefined;
    if (currentPlan && recommendedPlan && currentPlan.id !== recommendedPlan.id) {
      const currentMonthly = currentPlan.monthlyPrice;
      const recommendedMonthly = recommendedPlan.monthlyPrice;
      
      if (recommendedMonthly < currentMonthly) {
        savings = currentMonthly - recommendedMonthly;
      }
    }

    return {
      recommendedPlan: recommendedPlan ?? this.PLANS[0] ?? null,
      reason,
      savings,
    };
  }

  /**
   * Validate subscription change
   */
  static validateSubscriptionChange(
    currentSubscription: Subscription,
    newPlanId: string
  ): {
    canChange: boolean;
    reason?: string;
    effectiveDate?: Date;
  } {
    if (currentSubscription.status === 'cancelled') {
      return {
        canChange: false,
        reason: 'Cannot change plan for cancelled subscription',
      };
    }

    const newPlan = this.getPlanById(newPlanId);
    if (!newPlan) {
      return {
        canChange: false,
        reason: 'Invalid plan selected',
      };
    }

    // Allow immediate change for upgrades
    const currentPlan = this.getPlanById(currentSubscription.planId);
    if (!currentPlan) {
      return { canChange: false, reason: 'Current plan not found' };
    }

    const planTiers = ['starter', 'standard', 'pro', 'enterprise'];
    const currentIndex = planTiers.indexOf(currentPlan.tier);
    const newIndex = planTiers.indexOf(newPlan.tier);

    if (newIndex > currentIndex) {
      return {
        canChange: true,
        effectiveDate: new Date(), // Immediate for upgrades
      };
    }

    // Downgrades take effect at next billing cycle
    return {
      canChange: true,
      effectiveDate: currentSubscription.currentPeriodEnd,
    };
  }
}
