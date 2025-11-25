import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

import { useMessageStore, useMatchStore, useAuthStore } from '../../store';
import { COLORS, APP_CONFIG, calculateAge } from '../../constants';
import type { Message } from '../../types';

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { matchId } = route.params;
  
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const { matches, unmatch, blockUser, reportUser } = useMatchStore();
  const {
    messages,
    messageLimit,
    isLoading,
    isSending,
    shouldShowDateSuggestion,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
  } = useMessageStore();

  const [inputText, setInputText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const match = matches.find((m) => m.id === matchId);
  const otherUser = match?.other_user;

  useEffect(() => {
    fetchMessages(matchId);
    const unsubscribe = subscribeToMessages(matchId);
    return unsubscribe;
  }, [matchId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const { error } = await sendMessage(matchId, inputText.trim());
    
    if (error) {
      Alert.alert('Unable to send', error);
    } else {
      setInputText('');
    }
  };

  const handleUnmatch = () => {
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${otherUser?.first_name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            await unmatch(matchId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Block ${otherUser?.first_name}? They won't be able to see or match with you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(otherUser!.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Fake profile', onPress: () => reportAndBlock('fake_profile') },
        { text: 'Harassment', onPress: () => reportAndBlock('harassment') },
        { text: 'Inappropriate', onPress: () => reportAndBlock('inappropriate_content') },
        { text: 'Spam', onPress: () => reportAndBlock('spam') },
      ]
    );
  };

  const reportAndBlock = async (reason: string) => {
    await reportUser(otherUser!.id, reason);
    await blockUser(otherUser!.id);
    Alert.alert('Reported', 'Thank you for keeping our community safe.');
    navigation.goBack();
  };

  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const showTimestamp = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={styles.timestamp}>{formatMessageTime(item.created_at)}</Text>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (!match || !otherUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const age = calculateAge(otherUser.birth_date);
  const canSend = messageLimit?.can_send !== false;
  const messagesRemaining = messageLimit 
    ? APP_CONFIG.INITIAL_MESSAGE_LIMIT - messageLimit.messages_today 
    : APP_CONFIG.INITIAL_MESSAGE_LIMIT;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileInfo}
          onPress={() => navigation.navigate('ProfileDetail', { userId: otherUser.id })}
        >
          <Image source={{ uri: otherUser.main_photo_url }} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{otherUser.first_name}, {age}</Text>
            <Text style={styles.status}>Tap to view profile</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionsButton} onPress={() => setShowOptions(!showOptions)}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Options dropdown */}
      {showOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity style={styles.optionItem} onPress={handleUnmatch}>
            <Ionicons name="heart-dislike-outline" size={20} color={COLORS.text} />
            <Text style={styles.optionText}>Unmatch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
            <Ionicons name="ban-outline" size={20} color={COLORS.error} />
            <Text style={[styles.optionText, { color: COLORS.error }]}>Block</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
            <Ionicons name="flag-outline" size={20} color={COLORS.error} />
            <Text style={[styles.optionText, { color: COLORS.error }]}>Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date suggestion banner */}
      {shouldShowDateSuggestion && (
        <TouchableOpacity
          style={styles.dateBanner}
          onPress={() => navigation.navigate('DateSuggestion', { matchId })}
        >
          <View style={styles.dateBannerContent}>
            <Ionicons name="restaurant" size={24} color={COLORS.secondary} />
            <View style={styles.dateBannerText}>
              <Text style={styles.dateBannerTitle}>Time for a date! 🎉</Text>
              <Text style={styles.dateBannerSubtitle}>Tap to pick a venue together</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message limit warning */}
      {!canSend && (
        <View style={styles.limitBanner}>
          <Ionicons name="time-outline" size={16} color={COLORS.warning} />
          <Text style={styles.limitText}>
            Waiting for a reply. {messagesRemaining} messages left today.
          </Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder={canSend ? "Type a message..." : "Waiting for reply..."}
          placeholderTextColor={COLORS.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={canSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || !canSend || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || !canSend || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  status: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  optionsButton: {
    padding: 8,
  },
  optionsMenu: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondary + '15',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },
  dateBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBannerText: {
    flex: 1,
  },
  dateBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  dateBannerSubtitle: {
    fontSize: 13,
    color: COLORS.secondaryDark,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFF',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.warning + '15',
  },
  limitText: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default ChatScreen;
