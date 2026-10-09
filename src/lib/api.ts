import { API_BASE } from '@/constants/app';
import {
  deliveryRun,
  households,
  supplyPools,
  waterPassport,
} from '@/data/mock';
import { buildPriorityRequest, sortByPriority } from '@/lib/priority';
import type {
  BookingPreview,
  DeliveryRun,
  HouseholdProfile,
  PriorityRequest,
  SupplyPool,
  WaterPassport,
} from '@/types';

const TIMEOUT_MS = 1200;

async function get<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function withFallback<T>(path: string, fallback: () => T): Promise<T> {
  try {
    return await get<T>(path);
  } catch {
    return fallback();
  }
}

export const api = {
  // READY STATE: used by the UI to badge "live" vs "offline demo".
  async healthy(): Promise<boolean> {
    try {
      await get<{ ok: boolean }>('/health');
      return true;
    } catch {
      return false;
    }
  },

  async priorityQueue(homeId: string): Promise<PriorityRequest[]> {
    return withFallback(`/priority/queue?homeId=${homeId}`, () =>
      sortByPriority(households),
    );
  },

  async bookingPreview(homeId: string): Promise<BookingPreview> {
    return withFallback(`/bookings/preview?homeId=${homeId}`, () => {
      const home = households.find((h) => h.id === homeId) ?? households[0];
      return {
        request: buildPriorityRequest(home, 2),
        slots: [
          { date: 'Today', window: '2:30 – 4:30 PM' },
          { date: 'Today', window: '6:00 – 8:00 PM' },
          { date: 'Tomorrow', window: '6:00 – 8:00 AM' },
        ],
        poolActive: true,
        pricePerLitre: 0.33,
        standardPricePerLitre: 0.45,
        surgeFactor: 1.0,
        creditScored: true,
      };
    });
  },

  async passengerAt(homeId: string): Promise<WaterPassport> {
    return withFallback(`/passport/${homeId}`, () => waterPassport);
  },

  async activeRun(): Promise<DeliveryRun> {
    return withFallback('/deliveries/active', () => deliveryRun);
  },

  async pools(homeId: string): Promise<SupplyPool[]> {
    return withFallback(`/pools?homeId=${homeId}`, () => supplyPools);
  },

  async joinPool(poolId: string, homeId: string): Promise<SupplyPool> {
    return post<SupplyPool>(`/pools/${poolId}/join`, { homeId });
  },

  async verifyDeliveryOtp(runId: string, stopIndex: number, otp: string) {
    return post<{ verified: boolean; remainingLitres: number }>(
      `/deliveries/${runId}/stop/${stopIndex}/verify`,
      { otp },
    );
  },

  async createBooking(homeId: string, litres: number) {
    return post<{ bookingRef: string; queueLine: number }>(
      `/bookings`,
      { homeId, litres, source: 'app' },
    );
  },

  home(id: string): HouseholdProfile | undefined {
    return households.find((h) => h.id === id);
  },
};

export { households };