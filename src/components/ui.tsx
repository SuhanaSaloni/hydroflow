import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  if (!scroll) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <View className={`mx-4 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200 ${className}`}>
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  icon?: LucideIcon;
}) {
  return (
    <View className="mt-6 flex-row items-center justify-between px-5 pb-2">
      <View className="flex-row items-center gap-2">
        {Icon ? (
          <View className="items-center justify-center rounded-xl bg-hydro-50 p-2">
            <Icon size={16} color="#0284c7" />
          </View>
        ) : null}
        <View>
          <Text className="text-base font-bold text-slate-900">{title}</Text>
          {subtitle ? <Text className="text-xs text-slate-500">{subtitle}</Text> : null}
        </View>
      </View>
      {action ? <Text className="text-xs font-semibold text-hydro-600">{action}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  accent = '#0284c7',
  icon: Icon,
}: {
  label: string;
  accent?: string;
  icon?: LucideIcon;
}) {
  return (
    <View
      className="flex-row items-center gap-1 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${accent}1a` }}
    >
      {Icon ? <Icon size={12} color={accent} /> : null}
      <Text className="text-[11px] font-semibold" style={{ color: accent }}>
        {label}
      </Text>
    </View>
  );
}

export function Stat({
  label,
  value,
  valueColor = '#0f172a',
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] font-medium text-slate-500">{label}</Text>
      <Text className="mt-0.5 text-lg font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
      {sub ? <Text className="text-[10px] text-slate-400">{sub}</Text> : null}
    </View>
  );
}

export function ProgressBar({
  fraction,
  color = '#0ea5e9',
  className = '',
}: {
  fraction: number;
  color?: string;
  className?: string;
}) {
  return (
    <View className={`h-2 overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(2, fraction * 100))}%`, backgroundColor: color }}
      />
    </View>
  );
}