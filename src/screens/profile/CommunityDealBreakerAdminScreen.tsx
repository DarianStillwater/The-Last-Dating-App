import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useCommunityDealBreakerStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';

const CommunityDealBreakerAdminScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { cycleId, submissionId } = route.params;

  const { approveQuestion, rejectCycleWinner, isLoading } = useCommunityDealBreakerStore();

  const [submissionText, setSubmissionText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerType, setAnswerType] = useState<'yes_no' | 'multi_choice'>('yes_no');
  const [answerOptions, setAnswerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      const { data } = await supabase
        .from('community_dealbreaker_submissions')
        .select('question_text')
        .eq('id', submissionId)
        .single();

      if (data) {
        setSubmissionText(data.question_text);
        setQuestionText(data.question_text);
      }
      setIsFetching(false);
    };
    fetchSubmission();
  }, [submissionId]);

  const handleGenerateOptions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-answer-options', {
        body: { question_text: questionText },
      });

      if (error) throw error;

      setAnswerType(data.answer_type);
      setAnswerOptions(data.options);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate options');
    }
    setIsGenerating(false);
  };

  const handleApprove = async () => {
    if (answerOptions.length < 2) {
      Alert.alert('Error', 'Please generate answer options first.');
      return;
    }

    Alert.alert(
      'Approve Question',
      'This will add the question as a permanent community dealbreaker and notify all users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const { error } = await approveQuestion(
              submissionId,
              cycleId,
              questionText,
              answerType,
              answerOptions,
            );
            if (error) {
              Alert.alert('Error', error);
            } else {
              Alert.alert('Approved', 'Question has been added and users have been notified.');
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Question',
      'This will reject the winning question for this cycle. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            const { error } = await rejectCycleWinner(cycleId);
            if (error) {
              Alert.alert('Error', error);
            } else {
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const updateOptionLabel = (index: number, label: string) => {
    const updated = [...answerOptions];
    updated[index] = { ...updated[index], label };
    setAnswerOptions(updated);
  };

  const updateOptionValue = (index: number, value: string) => {
    const updated = [...answerOptions];
    updated[index] = { ...updated[index], value };
    setAnswerOptions(updated);
  };

  const removeOption = (index: number) => {
    if (answerOptions.length <= 2) {
      Alert.alert('Error', 'Must have at least 2 options.');
      return;
    }
    setAnswerOptions(answerOptions.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setAnswerOptions([...answerOptions, { value: '', label: '' }]);
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
        <Text style={styles.headerTitle}>Admin Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Original Submission</Text>
        <Text style={styles.originalText}>{submissionText}</Text>

        <Text style={styles.sectionTitle}>Final Question Text</Text>
        <TextInput
          style={styles.textInput}
          value={questionText}
          onChangeText={setQuestionText}
          multiline
          textAlignVertical="top"
        />

        <Button
          title={isGenerating ? 'Generating...' : 'Generate Answer Options with AI'}
          onPress={handleGenerateOptions}
          variant="outline"
          loading={isGenerating}
          style={styles.generateButton}
        />

        {answerOptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Answer Type: {answerType === 'yes_no' ? 'Yes/No' : 'Multiple Choice'}
            </Text>

            <Text style={styles.sectionTitle}>Answer Options</Text>
            {answerOptions.map((opt, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={styles.optionInputs}>
                  <TextInput
                    style={styles.optionValueInput}
                    value={opt.value}
                    onChangeText={(v) => updateOptionValue(index, v)}
                    placeholder="value"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TextInput
                    style={styles.optionLabelInput}
                    value={opt.label}
                    onChangeText={(l) => updateOptionLabel(index, l)}
                    placeholder="Label"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                <TouchableOpacity onPress={() => removeOption(index)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addOptionText}>Add Option</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Reject"
          onPress={handleReject}
          variant="outline"
          style={styles.rejectButton}
          loading={isLoading}
        />
        <Button
          title="Approve"
          onPress={handleApprove}
          loading={isLoading}
          disabled={answerOptions.length < 2}
          style={styles.approveButton}
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
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  originalText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
  },
  generateButton: {
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  optionInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  optionValueInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  optionLabelInput: {
    flex: 2,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addOptionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rejectButton: {
    flex: 1,
  },
  approveButton: {
    flex: 2,
  },
});

export default CommunityDealBreakerAdminScreen;
