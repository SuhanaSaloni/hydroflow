import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  Beaker,
  Check,
  ChevronRight,
  CircleDot,
  Droplets,
  Navigation,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Wallet,
  X,
} from 'lucide-react-native';
import { Card, Chip, ProgressBar, Screen, SectionHeader, Stat } from '@/components/ui';
import DeliveryMap from '@/components/DeliveryMap';
import OtpPad from '@/components/OtpPad';
import { api } from '@/lib/api';
import { formatEta, formatLitres } from '@/lib/format';
import type { DeliveryRun, DeliveryStop } from '@/types';

export default function DriverPortal() {
  const [run, setRun] = useState<DeliveryRun | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [proofStop, setProofStop] = useState<DeliveryStop | null>(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; delivered: number } | null>(null);

  useEffect(() => {
    api.activeRun().then((r) => {
      setRun(r);
      const active = r.stops.find((s) => s.status === 'IN_TRANSIT') ?? r.stops[0];
      setSelectedIndex(active.index);
    });
  }, []);

  const openProof = (stop: DeliveryStop) => {
    setResult(null);
    setOtp('');
    setProofStop(stop);
  };

  if (!run) return null;

  const deliveredSoFar = run.totalLitresLoaded - run.stops.reduce(
    (sum, s) => (s.status === 'DELIVERED' ? sum + s.litres : sum),
    0,
  );

  const verify = async () => {
    if (!proofStop || otp.length < 4) return;
    setVerifying(true);
    try {
      const res = await api.verifyDeliveryOtp(run.id, proofStop.index, otp);
      setResult({ ok: res.verified, delivered: proofStop.litres });
    } catch {
      setResult({ ok: otp === proofStop.otp, delivered: proofStop.litres });
    } finally {
      setVerifying(false);
    }
  };

  const confirmDischarge = () => {
    if (!proofStop || !result?.ok) return;
    setRun((prev) => {
      if (!prev) return prev;
      const stopIdx = prev.stops.findIndex((s) => s.index === proofStop.index);
      const stops = prev.stops.map((s, i) => {
        if (i === stopIdx) return { ...s, status: 'DELIVERED' as const };
        if (i === stopIdx + 1) return { ...s, status: 'IN_TRANSIT' as const };
        return s;
      });
      return { ...prev, stops, status: stops.every((s) => s.status === 'DELIVERED') ? 'COMPLETED' : 'ON_ROUTE' };
    });
    setProofStop(null);
    setSelectedIndex(proofStop.index + 1);
  };

  return (
    <Screen>
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-500">Fleet Manager · Active run</Text>
            <Text className="text-xl font-extrabold text-slate-900">
              {run.plate} · {run.loadId}
            </Text>
          </View>
          <Chip
            label={run.status === 'ON_ROUTE' ? 'On route' : 'Completed'}
            accent={run.status === 'ON_ROUTE' ? '#0284c7' : '#16a34a'}
            icon={Navigation}
          />
        </View>
      </View>

      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-900">Loaded tanker</Text>
          <Text className="text-xs font-bold text-hydro-700">
            {formatLitres(run.totalLitresLoaded)} / {formatLitres(run.capacityLitres)}
          </Text>
        </View>
        <ProgressBar fraction={1} color="#0ea5e9" className="mt-2" />
        <View className="mt-3 flex-row">
          <Stat label="Source borewell" value={run.sourceBorewell} sub="TDS verified · lab graded" />
          <Stat label="Remaining on board" value={formatLitres(deliveredSoFar)} />
          <Stat label="Stops this load" value={`${run.stops.length}`} />
        </View>
        <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <View className="items-center justify-center rounded-2xl bg-hydro-600 p-2.5">
            <Truck size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900">{run.driverName}</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <ShieldCheck size={12} color="#16a34a" />
                <Text className="text-[11px] text-slate-500">Safety 4.8</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Beaker size={12} color="#0284c7" />
                <Text className="text-[11px] text-slate-500">TDS 212 ppm</Text>
              </View>
            </View>
          </View>
          <Pressable className="rounded-2xl bg-white p-2.5">
            <Phone size={18} color="#0f172a" />
          </Pressable>
        </View>
      </Card>

      <View className="mt-4 px-4">
        <DeliveryMap run={run} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      </View>

      <SectionHeader
        title="Turn-by-turn stop sequence"
        subtitle="Nearest-cluster order · partial discharges"
        icon={CircleDot}
      />
      <View className="px-4">
        {run.stops.map((stop) => {
          const active = stop.status === 'IN_TRANSIT';
          const done = stop.status === 'DELIVERED';
          return (
            <Pressable
              key={stop.householdId}
              onPress={() => setSelectedIndex(stop.index)}
              className="mb-2 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm shadow-slate-100"
            >
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  done ? 'bg-slate-100' : active ? 'bg-hydro-600' : 'bg-white'
                }`}
                style={{ borderWidth: 1.5, borderColor: done ? '#cbd5e1' : active ? '#0284c7' : '#e2e8f0' }}
              >
                {done ? (
                  <Check size={16} color="#94a3b8" />
                ) : (
                  <Text className={`text-sm font-extrabold ${active ? 'text-white' : 'text-slate-600'}`}>
                    {stop.index}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-sm font-bold ${done ? 'text-slate-400' : 'text-slate-900'}`}>
                    {stop.householdName}
                  </Text>
                  {active ? <Chip label="Discharge now" accent="#0284c7" icon={Droplets} /> : null}
                </View>
                <Text className="text-[11px] text-slate-500">
                  {stop.address} · {stop.landmark}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-2">
                  <View className="rounded-full bg-hydro-50 px-2 py-0.5">
                    <Text className="text-[11px] font-bold text-hydro-700">
                      {formatLitres(stop.litres)} → {stop.remainingAfterStop > 0 ? formatLitres(stop.remainingAfterStop) : 'Empty'}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-400">ETA {formatEta(stop.etaMinutes)}</Text>
                </View>
              </View>
              {active ? (
                <Pressable
                  onPress={() => openProof(stop)}
                  className="rounded-2xl bg-hydro-600 px-3 py-2.5"
                >
                  <Text className="text-xs font-bold text-white">Verify OTP</Text>
                </Pressable>
              ) : done ? (
                <ShieldCheck size={18} color="#16a34a" />
              ) : (
                <ChevronRight size={18} color="#cbd5e1" />
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2 px-6">
        <View className="mb-6 flex-row items-center justify-center gap-1.5 rounded-2xl bg-amber-50 p-3">
          <ShieldAlert size={15} color="#d97706" />
          <Text className="text-[11px] font-medium text-amber-700">
            Rule 3 · Always verify the customer OTP before starting a discharge.
          </Text>
        </View>
      </View>

      <Modal
        visible={!!proofStop}
        transparent
        animationType="slide"
        onRequestClose={() => setProofStop(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-4xl bg-slate-50 p-5 pb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="rounded-2xl bg-hydro-600 p-2">
                  <Wallet size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900">Proof of Delivery</Text>
                  <Text className="text-[11px] text-slate-500">
                    {proofStop?.householdName} · {proofStop && formatLitres(proofStop.litres)} discharge
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setProofStop(null)} className="rounded-full bg-white p-2">
                <X size={16} color="#0f172a" />
              </Pressable>
            </View>

            {result ? (
              result.ok ? (
                <View className="items-center py-4">
                  <View className="rounded-full bg-green-100 p-5">
                    <Check size={40} color="#16a34a" />
                  </View>
                  <Text className="mt-3 text-base font-extrabold text-slate-900">OTP verified</Text>
                  <Text className="text-center text-xs text-slate-500">
                    {formatLitres(result.delivered)} metered and released. On-board balance now{' '}
                    {formatLitres(
                      run.stops.find((s) => s.index === proofStop?.index)?.remainingAfterStop ?? 0,
                    )}.
                  </Text>
                  <Pressable
                    onPress={confirmDischarge}
                    className="mt-4 w-full items-center rounded-2xl bg-hydro-600 py-3"
                  >
                    <Text className="text-sm font-bold text-white">Confirm discharged → next stop</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center py-4">
                  <View className="rounded-full bg-red-100 p-5">
                    <ShieldAlert size={40} color="#dc2626" />
                  </View>
                  <Text className="mt-3 text-base font-extrabold text-slate-900">OTP mismatch</Text>
                  <Text className="text-center text-xs text-slate-500">
                    Ask the customer to re-read the OTP and try again.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setResult(null);
                      setOtp('');
                    }}
                    className="mt-4 w-full items-center rounded-2xl border border-slate-200 py-3"
                  >
                    <Text className="text-sm font-bold text-slate-700">Retry</Text>
                  </Pressable>
                </View>
              )
            ) : (
              <View className="items-center">
                <Text className="mb-1 text-[11px] text-slate-500">
                  Enter the OTP the customer read out to you
                </Text>
                <View className="mb-2 self-start rounded-lg bg-white px-2 py-1">
                  <Text className="text-[10px] text-slate-400">
                    Demo hint · customer&apos;s phone shows {proofStop?.otp}
                  </Text>
                </View>
                <OtpPad value={otp} onChange={setOtp} />
                <Pressable
                  onPress={verify}
                  disabled={otp.length < 4 || verifying}
                  className="mt-5 w-full items-center rounded-2xl bg-hydro-600 py-3 disabled:opacity-50"
                >
                  <Text className="text-sm font-bold text-white">
                    {verifying ? 'Verifying…' : 'Verify & record delivery'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}