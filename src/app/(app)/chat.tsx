import { useAIChat } from '@mongrov/ai';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Bubble, GiftedChat } from 'react-native-gifted-chat';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { aiConfig } from '@/lib/ai';
import { useColorScheme } from '@/lib/theme';

const QUICK_REPLIES = [
  'What can you help me with?',
  'Tell me about this app',
  'How do I get started?',
];

function getTheme(isDark: boolean) {
  return {
    bg: isDark ? '#000' : '#fff',
    inputBg: isDark ? '#1c1c1e' : '#f5f5f5',
    inputBorder: isDark ? '#38383a' : '#e0e0e0',
    inputText: isDark ? '#fff' : '#000',
    placeholder: isDark ? '#8e8e93' : '#9e9e9e',
    sendBtn: isDark ? '#0a84ff' : '#007AFF',
    sendBtnDisabled: isDark ? '#3a3a3c' : '#c7c7cc',
    quickReplyBg: isDark ? '#2c2c2e' : '#e5e5ea',
    quickReplyText: isDark ? '#fff' : '#000',
    bubbleLeft: isDark ? '#2c2c2e' : '#e5e5ea',
    bubbleRight: isDark ? '#0a84ff' : '#007AFF',
    textLeft: isDark ? '#fff' : '#000',
  };
}

type Theme = ReturnType<typeof getTheme>;

export default function Chat() {
  const [inputText, setInputText] = useState('');

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

  return <ChatContent inputText={inputText} setInputText={setInputText} />;
}

function ChatContent({
  inputText,
  setInputText,
}: {
  inputText: string;
  setInputText: (text: string) => void;
}) {
  const { messages, send, isStreaming } = useAIChat();
  const { isDark } = useColorScheme();
  const theme = getTheme(isDark);

  const giftedMessages = useMemo(() => messages.map((msg, idx) => ({
    _id: msg.id || idx,
    text: msg.content,
    createdAt: msg.createdAt || new Date(),
    user: {
      _id: msg.role === 'user' ? 'user' : 'assistant',
      name: msg.role === 'user' ? 'You' : 'Assistant',
    },
  })).reverse(), [messages]);

  const handleSend = useCallback((text?: string) => {
    const messageText = (text || inputText || '').trim();
    if (!messageText)
      return;
    setInputText('');
    send(messageText);
  }, [inputText, send, setInputText]);

  const canSend = (inputText || '').trim().length > 0 && !isStreaming;

  const renderChatEmpty = useCallback(() => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', transform: [{ scaleY: -1 }] }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>💬</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', color: theme.inputText, marginBottom: 4 }}>
        AI Assistant
      </Text>
      <Text style={{ fontSize: 14, color: theme.placeholder, textAlign: 'center', paddingHorizontal: 32 }}>
        Start a conversation with your AI assistant
      </Text>
    </View>
  ), [theme.inputText, theme.placeholder]);

  const renderBubble = useCallback((props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: { backgroundColor: theme.bubbleLeft },
        right: { backgroundColor: theme.bubbleRight },
      }}
      textStyle={{
        left: { color: theme.textLeft },
        right: { color: '#fff' },
      }}
    />
  ), [theme.bubbleLeft, theme.bubbleRight, theme.textLeft]);

  return (
    <>
      <FocusAwareStatusBar />
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <GiftedChat
            messages={giftedMessages}
            onSend={() => {}}
            user={{ _id: 'user' }}
            renderInputToolbar={() => null}
            renderChatEmpty={renderChatEmpty}
            isTyping={isStreaming}
            inverted={true}
            renderBubble={renderBubble}
          />
        </View>
        <QuickReplies visible={messages.length === 0} theme={theme} onSelect={handleSend} />
        <InputToolbar
          inputText={inputText}
          setInputText={setInputText}
          canSend={canSend}
          theme={theme}
          onSend={handleSend}
        />
      </View>
    </>
  );
}

function QuickReplies({ visible, theme, onSelect }: { visible: boolean; theme: Theme; onSelect: (t: string) => void }) {
  if (!visible)
    return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
      style={{ maxHeight: 50, borderTopWidth: 1, borderTopColor: theme.inputBorder }}
    >
      {QUICK_REPLIES.map(reply => (
        <TouchableOpacity
          key={reply}
          onPress={() => onSelect(reply)}
          style={{ backgroundColor: theme.quickReplyBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 }}
        >
          <Text style={{ color: theme.quickReplyText, fontSize: 14 }}>{reply}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function InputToolbar({
  inputText,
  setInputText,
  canSend,
  theme,
  onSend,
}: {
  inputText: string;
  setInputText: (t: string) => void;
  canSend: boolean;
  theme: Theme;
  onSend: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: theme.inputBg, borderTopWidth: 1, borderTopColor: theme.inputBorder }}>
      <TextInput
        value={inputText}
        onChangeText={setInputText}
        placeholder="Ask me anything..."
        placeholderTextColor={theme.placeholder}
        multiline
        style={{ flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: theme.bg, borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 16, color: theme.inputText, borderWidth: 1, borderColor: theme.inputBorder }}
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        style={{ marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: canSend ? theme.sendBtn : theme.sendBtnDisabled, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}
