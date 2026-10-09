import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Droplets,
  ShieldCheck,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip } from '@/components/ui';
import PriorityScoreCard from '@/components/PriorityScoreCard';
import { FAMILY_ID } from '@/constants/app';
import { api } from '@/lib/api';
import { formatLitres, formatMoney } from '@/lib/format';
import type { BookingPreview, DeliverySlot } from '@/types';

export default function BookScreen() {
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [litres, setLitres] = useState(1400);
  const [slot, setSlot] = useState<DeliverySlot | null>(null);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ ref: string; line: number } | null>(null);

  useEffect(() => {
    api.bookingPreview(FAMILY_ID).then((p) => {
      setPreview(p);
      setLitres(p.request.requestedLitres);
    });
  }, []);

  const estimate = useMemo(() => {
    if (!preview) return null;
    const gross = litres * preview.standardPricePerLitre;
    const net = litres * preview.pricePerLitre;
    const surge = preview.surgeFactor > 1 ? litres * (preview.surgeFactor - 1) * preview.standardPricePerLitre : 0;
    return { gross, net, surge, total: net + surge };
  }, [litres, preview]);

  if (!preview) return null;

  const confirm = async () => {
    setPlacing(true);
    try {
      const res = await api.createBooking(FAMILY_ID, litres);
      setDone({ ref: res.bookingRef, line: res.queueLine });
    } catch {
      setDone({ ref: 'BW-2026-0411', line: preview.request.linePosition });
    } finally {
      setPlacing(false);
    }
  };

  const step = (delta: number) =>
    setLitres((l) => Math.min(litresMax, Math.max(500, l + delta)));

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      {done ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center rounded-full bg-green-100 p-6">
            <CircleCheck size={64} color="#16a34a" />
          </View>
          <Text className="mt-5 text-center text-xl font-extrabold text-slate-900">
            Booking confirmed!
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            Ref <Text className="font-bold text-slate-800">{done.ref}</Text>
          </Text>
          <View className="mt-6 w-full rounded-3xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Droplets size={16} color="#0284c7" />
                <Text className="text-sm font-bold text-slate-800">{formatLitres(litres)} booking</Text>
              </View>
              <Text className="text-sm font-extrabold text-hydro-700">Queue #{done.line}</Text>
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <ShieldCheck size={15} color="#16a34a" />
              <Text className="text-xs text-slate-500">
                You&apos;ll receive an OTP on the driver&apos;s arrival for Proof-of-Delivery.
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
          <PriorityScoreCard request={preview.request} />

          <Card className="mt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900">How much do you need?</Text>
              <Chip label="7-day estimate" accent="#0284c7" icon={Droplets} />
            </View>
            <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <Pressable onPress={() => step(-100)} className="rounded-xl bg-white p-2.5">
                <ChevronDown size={20} color="#0f172a" />
              </Pressable>
              <View className="items-center">
                <Text className="text-2xl font-extrabold text-slate-900">{formatLitres(litres)}</Text>
                <Text className="text-[11px] text-slate-500">~{(litres / 135).toFixed(0)} person-days</Text>
              </View>
              <Pressable onPress={() => step(100)} className="rounded-xl bg-white p-2.5">
                <ChevronUp size={20} color="#0f172a" />
              </Pressable>
            </View>

            {estimate ? (
              <View className="mt-3 rounded-2xl border border-slate-100 p-3">
                <Row label={`Standard rate`} value={formatMoney(preview.standardPricePerLitre)} />
                <Row
                  label={`Pool bulk discount`}
                  value={`−${formatMoney(preview.standardPricePerLitre - preview.pricePerLitre)}`}
                  accent="#16a34a"
                />
                {estimate.surge > 0 ? <Row label="Peak-hour surge" value="+₹0.00" accent="#d97706" /> : null}
                <View className="mt-2 h-px bg-slate-100" />
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-slate-800">Estimated total</Text>
                  <Text className="text-lg font-extrabold text-hydro-700">
                    {formatMoney(estimate.total)}
                  </Text>
                </View>
              </View>
            ) : null}
          </Card>

          <Card className="mt-3">
            <Text className="text-sm font-bold text-slate-900">Choose a delivery window</Text>
            <Text className="text-[11px] text-slate-500">
              Autoclustered with nearest neighbour requests to fill a 10,000 L tanker.
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {preview.slots.map((s) => {
                const active = slot?.window === s.window && slot?.date === s.date;
                return (
                  <Pressable
                    key={s.window}
                    onPress={() => setSlot(s)}
                    className={`rounded-2xl border px-3 py-2 ${
                      active ? 'border-hydro-500 bg-hydro-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View className="flex-row items-center gap-1">
                      {active ? <Check size={13} color="#0284c7" /> : null}
                      <Text className={`text-xs font-bold ${active ? 'text-hydro-700' : 'text-slate-700'}`}>
                        {s.date}
                      </Text>
                    </View>
                    <Text className={`text-[11px] ${active ? 'text-hydro-600' : 'text-slate-400'}`}>
                      {s.window}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View className="px-5 pt-4">
            <Pressable
              onPress={confirm}
              disabled={placing || !slot}
              className="items-center rounded-2xl bg-hydro-600 py-3.5 disabled:opacity-50"
            >
              <Text className="text-sm font-bold text-white">
                {placing ? 'Placing booking…' : `Confirm booking · ${formatMoney(estimate ? estimate.total : 0)}`}
              </Text>
            </Pressable>
            <Text className="mt-2 text-center text-[11px] text-slate-400">
              Cancel for free up to 1 hour before your window.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const litresMax = 5000;

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className={`text-xs font-bold ${accent ?? 'text-slate-800'}`}>{value}</Text>
    </View>
  );
}