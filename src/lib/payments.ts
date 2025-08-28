// frontend/src/lib/payments.ts
import { api } from '@/lib/api';

export type PublicPlan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;  // 'IDR'
  interval: string;  // 'month' | 'year'
  active: boolean;
};

export type CheckoutRes = {
  token: string;
  redirect_url: string;
  orderId: string;
  amount: number;
  currency?: string;
};

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  return api<PublicPlan[]>('/api/payments/plans');
}

export async function checkoutPlan(planId: string, customer?: {
  email?: string; first_name?: string; last_name?: string; phone?: string;
}) {
  return api<CheckoutRes>('/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, customer }),
  });
}
