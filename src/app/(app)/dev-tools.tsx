import { DevToolsLogPanel } from '@mongrov/core/ui';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';

export default function DevTools() {
  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 pt-12">
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text className="text-xl font-bold">Dev Tools</Text>
        </View>
        <DevToolsLogPanel />
      </View>
    </>
  );
}
