import { Text, View } from 'react-native';
import { Equal, Plus } from 'lucide-react-native';
import { Card } from '@/components/ui';
import PriorityBadge from '@/components/PriorityBadge';
import { formatHours } from '@/lib/format';
import type { PriorityRequest } from '@/types';

function Term({
  label,
  value,
  weight,
  contribution,
  negative = false,
}: {
  label: string;
  value: string;
  weight: number;
  contribution: number;
  negative?: boolean;
}) {
  const sign = negative ? '−' : '+';
  return (
    <View className="flex-row items-center gap-2 py-1.5">
      <View className="h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
        <Text className="text-xs font-bold text-slate-600">{sign}</Text>
      </View>
      <Text className="flex-1 text-xs text-slate-600">{label}</Text>
      <Text className="text-xs text-slate-400">× {weight.toFixed(1)}</Text>
      <Text className="w-16 text-right text-sm font-bold text-slate-900">
        {negative ? '−' : '+'}
        {contribution.toFixed(1)}
      </Text>
    </View>
  );
}

export default function PriorityScoreCard({ request }: { request: PriorityRequest }) {
  const hr = request.hoursWithoutWater * 1.5;
  const critical = (request.criticalNeed ? 1 : 0) * 2.0;
  const bookings = request.recentBookings30d * 0.8;

  return (
    <Card>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-slate-900">How your place in the queue works</Text>
        <PriorityBadge tier={request.tier} />
      </View>
      <Text className="mb-1 text-[11px] text-slate-500">
        Fair-Share score is computed transparently before your booking is accepted.
      </Text>

      <View className="rounded-2xl bg-slate-50 p-3">
        <Term
          label="Time without water"
          value={formatHours(request.hoursWithoutWater)}
          weight={1.5}
          contribution={hr}
        />
        <Term
          label={request.criticalNeed ? 'Critical need (chronic/medical/children)' : 'Critical need'}
          value="active"
          weight={2.0}
          contribution={critical}
        />
        <Term
          label="Bookings in last 30 days"
          value={`${request.recentBookings30d} rides`}
          weight={0.8}
          contribution={bookings}
          negative
        />
        <View className="my-1 flex-row items-center gap-2">
          <Equal size={14} color="#64748b" />
          <Text className="flex-1 text-xs font-semibold text-slate-700">Fair-Share Score</Text>
          <Text className="text-right text-base font-extrabold text-hydro-700">
            {request.score.toFixed(1)}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center gap-1.5">
          <Text className="text-[11px] text-slate-400">Your line position</Text>
          <View className="ml-auto flex-row items-center gap-1">
            <Plus size={12} color="#0284c7" />
            <Text className="text-sm font-bold text-hydro-700">#{request.linePosition} in queue</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}