import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui';
import WaterPassportCard from '@/components/WaterPassportCard';
import { FAMILY_ID } from '@/constants/app';
import { api } from '@/lib/api';
import type { WaterPassport } from '@/types';

export default function PassportModal() {
  const [passport, setPassport] = useState<WaterPassport | null>(null);

  useEffect(() => {
    api.passengerAt(FAMILY_ID).then(setPassport);
  }, []);

  return (
    <Screen scroll={false}>
      <View className="pt-2">
        {passport ? <WaterPassportCard passport={passport} /> : null}
      </View>
    </Screen>
  );
}