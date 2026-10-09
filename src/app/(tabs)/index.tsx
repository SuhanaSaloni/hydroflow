import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  ArrowRight,
  BadgeCheck,
  Droplets,
  Flame,
  Radio,
  Sparkles,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { Card, Chip, ProgressBar, Screen, SectionHeader, Stat } from '@/components/ui';
import TankMeter from '@/components/TankMeter';
import WaterPassportCard from '@/components/WaterPassportCard';
import PriorityBadge from '@/components/PriorityBadge';
import SupplyPoolCard from '@/components/SupplyPoolCard';
import { FAMILY_ID } from '@/constants/app';
import { tankHealthColor } from '@/constants/theme';
import { api } from '@/lib/api';
import { forecast, seasonalHeatFactor } from '@/lib/estimator';
import { formatLitres } from '@/lib/format';
import type { DispatchTier, SupplyPool, WaterPassport } from '@/types';

export default function ConsumerDashboard() {
  const home = useMemo(() => api.home(FAMILY_ID), []);
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const [passport, setPassport] = useState<WaterPassport | null>(null);
  const [linePosition, setLinePosition] = useState<number | null>(null);
  const [tier, setTier] = useState<DispatchTier>('REGULAR');
  const [pools, setPools] = useState<SupplyPool[]>([]);

  useEffect(() => {
    let alive = true;
    api.healthy().then((ok) => alive && setApiLive(ok));
    api.passengerAt(FAMILY_ID).then((p) => alive && setPassport(p));
    api.priorityQueue(FAMILY_ID).then((q) => {
      if (!alive) return;
      const mine = q.find((r) => r.householdId === FAMILY_ID);
      if (mine) {
        setLinePosition(mine.linePosition);
        setTier(mine.tier);
      }
    });
    api.pools(FAMILY_ID).then((p) => alive && setPools(p));
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => {
    if (!home) return null;
    return forecast(
      home.currentLevelLitres,
      home.tankCapacityLitres,
      home.occupants,
      seasonalHeatFactor(),
    );
  }, [home]);

  const joinPool = useCallback(async (poolId: string) => {
    setPools((prev) =>
      prev.map((p) => (p.id === poolId ? { ...p, joined: true, membersCount: p.membersCount + 1 } : p)),
    );
    try {
      await api.joinPool(poolId, FAMILY_ID);
    } catch {
      // offline demo — local state already reflects the join
    }
  }, []);

  if (!home || !data) return null;

  const demoMode = apiLive === false || apiLive === null;

  return (
    <Screen>
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-500">Namaste,</Text>
            <Text className="text-xl font-extrabold text-slate-900">Mehta Family</Text>
          </View>
          <View
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
              demoMode ? 'bg-amber-50' : 'bg-green-50'
            }`}
          >
            {demoMode ? <WifiOff size={13} color="#d97706" /> : <Wifi size={13} color="#16a34a" />}
            <Text className={`text-[11px] font-bold ${demoMode ? 'text-amber-700' : 'text-green-700'}`}>
              {demoMode ? 'Offline demo' : 'Server live'}
            </Text>
          </View>
        </View>
      </View>

      <Card className="mt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-slate-900">Water Level Health</Text>
            <Sparkles size={14} color="#0284c7" />
          </View>
          <Chip label="Sensorless estimator" accent="#0284c7" icon={Radio} />
        </View>
        <TankMeter data={data} />
        <View className="mt-1 flex-row">
          <Stat
            label="Daily depletion"
            value={formatLitres(data.dailyDepletionLitres)}
            sub={`${home.occupants} occupants × 135 L`}
          />
          <Stat
            label="Days of water left"
            value={data.daysUntilEmpty.toFixed(1)}
            valueColor={tankHealthColor(data.health)}
            sub="at current usage"
          />
          <Stat
            label="Heat factor"
            value={`+${Math.round(data.heatFactor * 100)}%`}
            valueColor={data.heatFactor > 0.2 ? '#d97706' : '#475569'}
            sub="seasonal"
          />
        </View>
        <View className="mt-3 rounded-2xl bg-slate-50 p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Flame size={15} color="#d97706" />
              <Text className="text-xs font-semibold text-slate-700">Estimated day tank runs dry</Text>
            </View>
            <Text className="text-sm font-extrabold text-slate-900">
              in ~{Math.max(0, data.daysUntilEmpty).toFixed(0)} days
            </Text>
          </View>
          <ProgressBar
            fraction={1 - data.currentLitres / data.capacityLitres}
            color="#cbd5e1"
            className="mt-2"
          />
        </View>
        <Link href="/book" asChild>
          <Pressable className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-hydro-600 py-3.5 active:bg-hydro-700">
            <Droplets size={17} color="#fff" />
            <Text className="text-sm font-bold text-white">Book a Tanker</Text>
            <ArrowRight size={16} color="#fff" />
          </Pressable>
        </Link>
      </Card>

      {linePosition != null ? (
        <Link href="/book" asChild>
          <View className="mx-4 mt-3 flex-row items-center gap-3 rounded-2xl bg-hydro-50 p-3">
            <View className="rounded-xl bg-white p-2">
              <Wallet size={18} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-800">
                Your fair-share queue position
              </Text>
              <Text className="text-[11px] text-slate-500">
                Score computed from need, criticality &amp; usage
              </Text>
            </View>
            <PriorityBadge tier={tier} />
            <Text className="text-lg font-extrabold text-hydro-700">#{linePosition}</Text>
          </View>
        </Link>
      ) : null}

      <SectionHeader title="Digital Water Passport" subtitle="Purity & driver traceability" icon={BadgeCheck} />
      {passport ? <WaterPassportCard passport={passport} /> : null}

      <SectionHeader
        title="Community Supply Pools"
        subtitle="Neighbours booking together = cheaper water"
        icon={Users}
      />
      <View className="px-4">
        {pools.slice(0, 2).map((p) => (
          <SupplyPoolCard key={p.id} pool={p} onJoin={() => joinPool(p.id)} onShare={() => {}} />
        ))}
      </View>
      <View className="mt-1 px-6">
        <Link href="/(tabs)/pool" asChild>
          <Pressable className="flex-row items-center justify-center gap-1 rounded-2xl border border-slate-200 py-3">
            <Text className="text-sm font-semibold text-hydro-700">View all pools</Text>
            <ArrowRight size={15} color="#0284c7" />
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}