import { Text, View } from 'react-native';
import { ArrowDown, Minus, Zap } from 'lucide-react-native';
import { tierLabel } from '@/constants/theme';
import type { DispatchTier } from '@/types';

const config: Record<DispatchTier, { color: string; bg: string; icon: typeof Zap }> = {
  HIGH: { color: '#dc2626', bg: '#fee2e2', icon: Zap },
  MEDIUM: { color: '#d97706', bg: '#fef3c7', icon: Minus },
  REGULAR: { color: '#0284c7', bg: '#e0f2fe', icon: ArrowDown },
};

export default function PriorityBadge({
  tier,
  className = '',
}: {
  tier: DispatchTier;
  className?: string;
}) {
  const c = config[tier];
  const Icon = c.icon;
  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${className}`}
      style={{ backgroundColor: c.bg }}
    >
      <Icon size={11} color={c.color} />
      <Text className="text-[11px] font-bold" style={{ color: c.color }}>
        {tierLabel[tier]}
      </Text>
    </View>
  );
}