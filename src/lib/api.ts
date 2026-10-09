import { Platform } from 'react-native';
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

// Static web exports (e.g. Vercel) ship without a backend. When the web build
// has no EXPO_PUBLIC_API_URL configured, every call resolves straight from the
// bundled mock data below instead of waiting on a dead endpoint. Native builds
// keep the localhost/emulator default from constants/app, and any network
// failure on any platform falls back the same way.
const LIVE_API =
  Platform.OS !== 'web' || Boolean(process.env.EXPO_PUBLIC_API_URL);

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!LIVE_API) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function withFallback<T>(path: string, fallback: () => T): Promise<T> {
  const live = await request<T>(path);
  return live ?? fallback();
}

async function postWithFallback<T>(
  path: string,
  body: unknown,
  fallback: () => T,
): Promise<T> {
  const live = await post<T>(path, body);
  return live ?? fallback();
}

function offlineQueueLine(homeId: string): number {
  const line = sortByPriority(households).findIndex((h) => h.householdId === homeId) + 1;
  return line > 0 ? line : 1;
}

export const api = {
  // READY STATE: used by the UI to badge "live" vs "offline demo".
  async healthy(): Promise<boolean> {
    return (await request<{ ok: boolean }>('/health')) !== null;
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
        request: buildPriorityRequest(home, offlineQueueLine(home.id)),
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
    return postWithFallback(`/pools/${poolId}/join`, { homeId }, () => {
      const pool = supplyPools.find((p) => p.id === poolId) ?? supplyPools[0];
      return { ...pool, joined: true };
    });
  },

  async verifyDeliveryOtp(runId: string, stopIndex: number, otp: string) {
    return postWithFallback<{ verified: boolean; remainingLitres: number }>(
      `/deliveries/${runId}/stop/${stopIndex}/verify`,
      { otp },
      () => {
        const stop = deliveryRun.stops.find((s) => s.index === stopIndex);
        return {
          verified: stop ? stop.otp === otp : false,
          remainingLitres: stop?.remainingAfterStop ?? 0,
        };
      },
    );
  },

  async createBooking(homeId: string, litres: number) {
    return postWithFallback<{ bookingRef: string; queueLine: number }>(
      `/bookings`,
      { homeId, litres, source: 'app' },
      () => ({
        bookingRef: `BW-2026-${String(Date.now()).slice(-4)}`,
        queueLine: offlineQueueLine(homeId),
      }),
    );
  },

  home(id: string): HouseholdProfile | undefined {
    return households.find((h) => h.id === id);
  },
};

export { households };
