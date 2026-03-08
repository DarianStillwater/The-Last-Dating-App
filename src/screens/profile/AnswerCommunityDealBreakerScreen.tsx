import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useCommunityDealBreakerStore } from '../../store';
import { COLORS } from '../../constants';
import { COMMUNITY_DEALBREAKER_COPY } from '../../theme/plantMetaphors';

const AnswerCommunityDealBreakerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { questionId } = route.params;

  const {
    approvedQuestions,
    myAnswers,
    myPreferences,
    fetchApprovedQuestions,
    fetchMyAnswers,
    fetchMyPreferences,
    answerQuestion,
    updatePreference,
  } = useCommunityDealBreakerStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedPreferences, setSelectedPreferences] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const question = approvedQuestions.find((q) => q.id === questionId);

  useEffect(() => {
    if (approvedQuestions.length === 0) fetchApprovedQuestions();
    if (myAnswers.length === 0) fetchMyAnswers();
    if (myPreferences.length === 0) fetchMyPreferences();
  }, []);

  useEffect(() => {
    const existing = myAnswers.find((a) => a.question_id === questionId);
    if (existing) setSelectedAnswer(existing.answer_value);

    const existingPref = myPreferences.find((p) => p.question_id === questionId);
    if (existingPref) setSelectedPreferences(existingPref.acceptable_answers);
  }, [myAnswers, myPreferences, questionId]);

  const togglePreference = (value: string) => {
    if (selectedPreferences === null) {
      setSelectedPreferences([value]);
    } else if (selectedPreferences.includes(value)) {
      const filtered = selectedPreferences.filter((v) => v !== value);
      setSelectedPreferences(filtered.length > 0 ? filtered : null);
    } else {
      setSelectedPreferences([...selectedPreferences, value]);
    }
  };

  const handleSave = async () => {
    if (!selectedAnswer) {
      Alert.alert('Required', 'Please select your answer.');
      return;
    }

    setIsSaving(true);
    const { error: ansError } = await answerQuestion(questionId, selectedAnswer);
    if (ansError) {
      Alert.alert('Error', ansError);
      setIsSaving(false);
      return;
    }

    const { error: prefError } = await updatePreference(questionId, selectedPreferences);
    if (prefError) {
      Alert.alert('Error', prefError);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    navigation.goBack();
  };

  if (!question) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Question</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Question</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.questionText}>{question.question_text}</Text>

        <Text style={styles.sectionLabel}>{COMMUNITY_DEALBREAKER_COPY.answerPrompt}</Text>
        <View style={styles.chipsContainer}>
          {question.answer_options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, selectedAnswer === opt.value && styles.chipSelected]}
              onPress={() => setSelectedAnswer(opt.value)}
            >
              <Text style={[styles.chipText, selectedAnswer === opt.value && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{COMMUNITY_DEALBREAKER_COPY.preferencePrompt}</Text>
        <View style={styles.chipsContainer}>
          <TouchableOpacity
            style={[styles.chip, selectedPreferences === null && styles.chipSelected]}
            onPress={() => setSelectedPreferences(null)}
          >
            <Text style={[styles.chipText, selectedPreferences === null && styles.chipTextSelected]}>
              Any
            </Text>
          </TouchableOpacity>
          {question.answer_options.map((opt) => (
            <TouchableOpacity
              key={`pref_${opt.value}`}
              style={[styles.chip, selectedPreferences?.includes(opt.value) && styles.chipSelected]}
              onPress={() => togglePreference(opt.value)}
            >
              <Text style={[styles.chipText, selectedPreferences?.includes(opt.value) && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Save"
          onPress={handleSave}
          loading={isSaving}
          disabled={!selectedAnswer}
        />
      </View>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight + '20',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default AnswerCommunityDealBreakerScreen;
