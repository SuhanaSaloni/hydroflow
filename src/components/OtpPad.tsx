import { Pressable, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';

export default function OtpPad({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const press = (n: string) => {
    if (value.length >= length) return;
    onChange(value + n);
  };
  const back = () => onChange(value.slice(0, -1));

  return (
    <View className="items-center">
      <View className="flex-row gap-3">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              className={`h-14 w-12 items-center justify-center rounded-2xl border-2 ${
                filled ? 'border-hydro-500 bg-hydro-50' : 'border-slate-200 bg-white'
              }`}
            >
              <Text className={`text-xl font-extrabold ${filled ? 'text-hydro-700' : 'text-slate-200'}`}>
                {filled ? value[i] : '•'}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="mt-5 w-56 flex-row flex-wrap justify-center">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <Key key={n} onPress={() => press(n)}>
            {n}
          </Key>
        ))}
        <Key onPress={back}>
          <Delete size={22} color="#475569" />
        </Key>
        <Key onPress={() => press('0')}>0</Key>
      </View>
    </View>
  );
}

function Key({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="m-1 h-14 w-14 items-center justify-center rounded-2xl bg-white active:bg-slate-100"
      style={{ borderColor: '#e2e8f0', borderWidth: 1 }}
    >
      <Text className="text-xl font-bold text-slate-800">{children}</Text>
    </Pressable>
  );
}