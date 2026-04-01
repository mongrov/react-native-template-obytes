import { ChatScreen } from '@mongrov/ai/ui';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { aiConfig } from '@/lib/ai';

export default function Chat() {
  if (!aiConfig) {
    return (
      <>
        <FocusAwareStatusBar />
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="text-lg font-semibold text-foreground">
            AI Not Configured
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            Set EXPO_PUBLIC_OPENAI_API_KEY in your .env file to enable AI chat.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 bg-background">
        <ChatScreen
          placeholder="Ask me anything..."
          emptyTitle="AI Assistant"
          emptySubtitle="Start a conversation with your AI assistant"
          assistantName="Assistant"
          quickReplies={[
            'What can you help me with?',
            'Tell me about this app',
            'How do I get started?',
          ]}
        />
      </View>
    </>
  );
}
