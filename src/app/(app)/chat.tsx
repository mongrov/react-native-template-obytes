import { ChatScreen } from '@mongrov/ai/ui';

import { FocusAwareStatusBar, View } from '@/components/ui';

export default function Chat() {
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
