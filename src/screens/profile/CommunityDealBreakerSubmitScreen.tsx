import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import CommunitySubmissionCard from '../../components/CommunitySubmissionCard';
import { useCommunityDealBreakerStore } from '../../store';
import { COLORS, APP_CONFIG } from '../../constants';
import { COMMUNITY_DEALBREAKER_COPY } from '../../theme/plantMetaphors';
import type { CommunityDealBreakerSubmission } from '../../types';

const CommunityDealBreakerSubmitScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { submitQuestion, checkSimilarSubmissions, voteForSubmission, isLoading } =
    useCommunityDealBreakerStore();

  const [questionText, setQuestionText] = useState('');
  const [similarSubmissions, setSimilarSubmissions] = useState<CommunityDealBreakerSubmission[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCheck = useCallback((text: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (text.trim().length < 10) {
        setSimilarSubmissions([]);
        return;
      }
      setIsChecking(true);
      const { similar } = await checkSimilarSubmissions(text);
      setSimilarSubmissions(similar);
      setIsChecking(false);
    }, 500);
  }, [checkSimilarSubmissions]);

  const handleTextChange = (text: string) => {
    setQuestionText(text);
    debouncedCheck(text);
  };

  const handleSubmit = async () => {
    if (questionText.trim().length < 10) {
      Alert.alert('Too short', 'Please enter a question with at least 10 characters.');
      return;
    }

    const { error } = await submitQuestion(questionText);
    if (error) {
      Alert.alert('Error', error);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{COMMUNITY_DEALBREAKER_COPY.submitPrompt}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Your dealbreaker question</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Is it a dealbreaker if your match doesn't like pets?"
          placeholderTextColor={COLORS.textSecondary}
          value={questionText}
          onChangeText={handleTextChange}
          maxLength={APP_CONFIG.COMMUNITY_SUBMISSION_MAX_LENGTH}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {questionText.length}/{APP_CONFIG.COMMUNITY_SUBMISSION_MAX_LENGTH}
        </Text>

        {similarSubmissions.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>Similar existing submissions:</Text>
            <Text style={styles.similarHint}>Vote for one instead of duplicating?</Text>
            {similarSubmissions.map((s) => (
              <CommunitySubmissionCard
                key={s.id}
                questionText={s.question_text}
                voteCount={s.vote_count}
                hasVoted={false}
                isOwnSubmission={false}
                onVote={() => {
                  voteForSubmission(s.id);
                  navigation.goBack();
                }}
                onUnvote={() => {}}
              />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Submit Question"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={questionText.trim().length < 10}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  similarSection: {
    marginTop: 24,
  },
  similarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  similarHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default CommunityDealBreakerSubmitScreen;
