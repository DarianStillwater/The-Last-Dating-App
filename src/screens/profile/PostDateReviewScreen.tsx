import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HintBubble from '../../components/HintBubble';
import { useTrustStore } from '../../store';
import { COLORS, ACCURACY_OPTIONS } from '../../constants';
import { TRUST_COPY } from '../../theme/plantMetaphors';
import type { AccuracyRating } from '../../types';
import Button from '../../components/ui/Button';

const QUESTIONS = [
  { key: 'photos_accurate' as const, label: 'Were their photos accurate?', icon: 'camera-outline' as const },
  { key: 'bio_honest' as const, label: 'Was their bio honest?', icon: 'document-text-outline' as const },
  { key: 'felt_safe' as const, label: 'Did you feel safe?', icon: 'shield-checkmark-outline' as const },
];

const PostDateReviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { matchId, reviewedUserId } = route.params;

  const { submitReview, submitVouch, isLoading } = useTrustStore();

  const [answers, setAnswers] = useState<Record<string, AccuracyRating>>({});
  const [includeVouch, setIncludeVouch] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  const handleSubmit = async () => {
    if (!allAnswered) return;

    const { error } = await submitReview(matchId, reviewedUserId, {
      photos_accurate: answers.photos_accurate,
      bio_honest: answers.bio_honest,
      felt_safe: answers.felt_safe,
    });

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    if (includeVouch) {
      await submitVouch(matchId, reviewedUserId);
    }

    Alert.alert('Thank you!', 'Your feedback helps the community grow.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="leaf" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>{TRUST_COPY.reviewPrompt.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>{TRUST_COPY.reviewPrompt.subtitle}</Text>

      {/* Questions */}
      <View style={styles.questionsContainer}>
        {QUESTIONS.map((question) => (
          <View key={question.key} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Ionicons name={question.icon} size={20} color={COLORS.primary} />
              <Text style={styles.questionText}>{question.label}</Text>
            </View>
            <View style={styles.optionsRow}>
              {ACCURACY_OPTIONS.map((option) => {
                const isSelected = answers[question.key] === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                    onPress={() => setAnswers({ ...answers, [question.key]: option.value as AccuracyRating })}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Vouch toggle */}
      <TouchableOpacity
        style={styles.vouchRow}
        onPress={() => setIncludeVouch(!includeVouch)}
      >
        <Ionicons
          name={includeVouch ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={includeVouch ? COLORS.primary : COLORS.textLight}
        />
        <View style={styles.vouchText}>
          <Text style={styles.vouchTitle}>{TRUST_COPY.vouchPrompt.title}</Text>
          <Text style={styles.vouchSubtitle}>{TRUST_COPY.vouchPrompt.subtitle}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Button
          title="Submit Review"
          onPress={handleSubmit}
          disabled={!allAnswered || isLoading}
          loading={isLoading}
        />
      </View>
      <HintBubble hintKey="post_date_review" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  questionsContainer: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.surface,
  },
  vouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  vouchText: {
    flex: 1,
  },
  vouchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  vouchSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
  },
});

export default PostDateReviewScreen;
