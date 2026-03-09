import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import Button from '../../components/ui/Button';
import { COLORS, ETHNICITY_OPTIONS, RELIGION_OPTIONS, OFFSPRING_OPTIONS, SMOKER_OPTIONS, ALCOHOL_OPTIONS, DIET_OPTIONS, DISTANCE_OPTIONS, cmToFeetInches, AGE_RANGE, HEIGHT_RANGE } from '../../constants';
import { useProfileStore, useCommunityDealBreakerStore } from '../../store';
import { ONBOARDING_COPY, COMMUNITY_DEALBREAKER_COPY } from '../../theme/plantMetaphors';
import { triggerFeedback } from '../../services/feedback';
import { useToast } from '../../components/ui/Toast';
import type { CommunityAnswerWithPreference } from '../../types';

const DealBreakersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const editMode = !!route.params?.editMode;
  const profileData = route.params?.profileData || {};
  const { dealBreakers, fetchDealBreakers, updateDealBreakers } = useProfileStore();

  const { approvedQuestions, fetchApprovedQuestions, myAnswers, myPreferences, fetchMyAnswers, fetchMyPreferences, saveAnswersAndPreferences } = useCommunityDealBreakerStore();

  const [step, setStep] = useState(1);
  const hasApprovedQuestions = approvedQuestions.length > 0;
  const totalSteps = hasApprovedQuestions ? 4 : 3;

  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(40);
  const [minHeight, setMinHeight] = useState(150);
  const [maxHeight, setMaxHeight] = useState(200);
  const [maxDistance, setMaxDistance] = useState(25);
  const [ethnicities, setEthnicities] = useState<string[]>([]);
  const [religions, setReligions] = useState<string[]>([]);
  const [offspring, setOffspring] = useState<string[]>([]);
  const [smoker, setSmoker] = useState<string[]>([]);
  const [alcohol, setAlcohol] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [communityAnswers, setCommunityAnswers] = useState<Record<string, string>>({});
  const [communityPreferences, setCommunityPreferences] = useState<Record<string, string[] | null>>({});
  const [communityLoading, setCommunityLoading] = useState(true);

  // Fetch community questions on mount
  useEffect(() => {
    const loadCommunity = async () => {
      setCommunityLoading(true);
      await fetchApprovedQuestions();
      if (editMode) {
        await fetchMyAnswers();
        await fetchMyPreferences();
      }
      setCommunityLoading(false);
    };
    loadCommunity();
  }, []);

  // Pre-fill community answers/preferences in edit mode
  useEffect(() => {
    if (editMode && myAnswers.length > 0) {
      const answers: Record<string, string> = {};
      myAnswers.forEach((a) => { answers[a.question_id] = a.answer_value; });
      setCommunityAnswers(answers);
    }
    if (editMode && myPreferences.length > 0) {
      const prefs: Record<string, string[] | null> = {};
      myPreferences.forEach((p) => { prefs[p.question_id] = p.acceptable_answers; });
      setCommunityPreferences(prefs);
    }
  }, [editMode, myAnswers, myPreferences]);

  useEffect(() => {
    if (editMode) {
      fetchDealBreakers().then(() => {
        const db = useProfileStore.getState().dealBreakers;
        if (!db) return;
        if (db.min_age) setMinAge(db.min_age);
        if (db.max_age) setMaxAge(db.max_age);
        if (db.min_height) setMinHeight(db.min_height);
        if (db.max_height) setMaxHeight(db.max_height);
        if (db.max_distance) setMaxDistance(db.max_distance);
        if (db.acceptable_ethnicities) setEthnicities(db.acceptable_ethnicities);
        if (db.acceptable_religions) setReligions(db.acceptable_religions);
        if (db.acceptable_offspring) setOffspring(db.acceptable_offspring);
        if (db.acceptable_smoker) setSmoker(db.acceptable_smoker);
        if (db.acceptable_alcohol) setAlcohol(db.acceptable_alcohol);
        if (db.acceptable_diets) setDiet(db.acceptable_diets);
      });
    }
  }, [editMode]);

  const toggleArray = (arr: string[], value: string, setter: (arr: string[]) => void) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  const renderChip = (value: string, label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={value}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const currentSelections = {
    min_age: minAge,
    max_age: maxAge,
    min_height: minHeight,
    max_height: maxHeight,
    max_distance: maxDistance,
    acceptable_ethnicities: ethnicities.length > 0 ? ethnicities : null,
    acceptable_religions: religions.length > 0 ? religions : null,
    acceptable_offspring: offspring.length > 0 ? offspring : null,
    acceptable_smoker: smoker.length > 0 ? smoker : null,
    acceptable_alcohol: alcohol.length > 0 ? alcohol : null,
    acceptable_diets: diet.length > 0 ? diet : null,
  };

  const getCommunityAnswersForSave = (): CommunityAnswerWithPreference[] => {
    return approvedQuestions
      .filter((q) => communityAnswers[q.id])
      .map((q) => ({
        questionId: q.id,
        answerValue: communityAnswers[q.id],
        acceptableAnswers: communityPreferences[q.id] ?? null,
      }));
  };

  const handleFinish = async () => {
    if (editMode) {
      await handleSave();
    } else {
      navigation.navigate('Bio', {
        profileData,
        dealBreakers: currentSelections,
        communityDealBreakerAnswers: getCommunityAnswersForSave(),
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await updateDealBreakers(currentSelections);
      if (error) {
        triggerFeedback('error');
        Alert.alert('Error', error);
        return;
      }

      // Save community dealbreaker answers/preferences
      const communityItems = getCommunityAnswersForSave();
      if (communityItems.length > 0) {
        const { error: commError } = await saveAnswersAndPreferences(communityItems);
        if (commError) {
          triggerFeedback('error');
          Alert.alert('Error', commError);
          return;
        }
      }

      triggerFeedback('save');
      navigation.goBack();
    } catch (e) {
      console.error('Save deal breakers error:', e);
      triggerFeedback('error');
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      triggerFeedback('onboardingStep');
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (editMode) {
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>The Essentials</Text>

      <Text style={styles.fieldLabel}>Age Range</Text>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeValue}>{minAge}</Text>
        <Text style={styles.rangeValue}>{maxAge}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={AGE_RANGE.MIN}
        maximumValue={maxAge - 1}
        step={1}
        value={minAge}
        onValueChange={setMinAge}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.primary}
      />
      <Slider
        style={styles.slider}
        minimumValue={minAge + 1}
        maximumValue={AGE_RANGE.MAX}
        step={1}
        value={maxAge}
        onValueChange={setMaxAge}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.primary}
      />

      <Text style={styles.fieldLabel}>Height</Text>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeValue}>{cmToFeetInches(minHeight)}</Text>
        <Text style={styles.rangeValue}>{cmToFeetInches(maxHeight)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={HEIGHT_RANGE.MIN_CM}
        maximumValue={maxHeight - 1}
        step={1}
        value={minHeight}
        onValueChange={setMinHeight}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.primary}
      />
      <Slider
        style={styles.slider}
        minimumValue={minHeight + 1}
        maximumValue={HEIGHT_RANGE.MAX_CM}
        step={1}
        value={maxHeight}
        onValueChange={setMaxHeight}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.primary}
      />

      <Text style={styles.fieldLabel}>Distance</Text>
      <View style={styles.chipsContainer}>
        {DISTANCE_OPTIONS.map((opt) =>
          renderChip(
            opt.value.toString(),
            opt.label,
            maxDistance === opt.value,
            () => setMaxDistance(opt.value)
          )
        )}
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Cultural Preferences</Text>

      <Text style={styles.fieldLabel}>Ethnicity</Text>
      <View style={styles.chipsContainer}>
        {ETHNICITY_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            ethnicities.includes(opt.value),
            () => toggleArray(ethnicities, opt.value, setEthnicities)
          )
        )}
      </View>

      <Text style={styles.fieldLabel}>Religion</Text>
      <View style={styles.chipsContainer}>
        {RELIGION_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            religions.includes(opt.value),
            () => toggleArray(religions, opt.value, setReligions)
          )
        )}
      </View>

      <Text style={styles.fieldLabel}>Children</Text>
      <View style={styles.chipsContainer}>
        {OFFSPRING_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            offspring.includes(opt.value),
            () => toggleArray(offspring, opt.value, setOffspring)
          )
        )}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Lifestyle Preferences</Text>

      <Text style={styles.fieldLabel}>Smoking</Text>
      <View style={styles.chipsContainer}>
        {SMOKER_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            smoker.includes(opt.value),
            () => toggleArray(smoker, opt.value, setSmoker)
          )
        )}
      </View>

      <Text style={styles.fieldLabel}>Drinking</Text>
      <View style={styles.chipsContainer}>
        {ALCOHOL_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            alcohol.includes(opt.value),
            () => toggleArray(alcohol, opt.value, setAlcohol)
          )
        )}
      </View>

      <Text style={styles.fieldLabel}>Diet</Text>
      <View style={styles.chipsContainer}>
        {DIET_OPTIONS.map((opt) =>
          renderChip(
            opt.value,
            opt.label,
            diet.includes(opt.value),
            () => toggleArray(diet, opt.value, setDiet)
          )
        )}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.noteText}>
          Leave sections empty to see all options.
        </Text>
      </View>
    </>
  );

  const toggleCommunityPreference = (questionId: string, value: string) => {
    const current = communityPreferences[questionId] || [];
    if (current === null) {
      setCommunityPreferences({ ...communityPreferences, [questionId]: [value] });
    } else if (current.includes(value)) {
      const filtered = current.filter((v) => v !== value);
      setCommunityPreferences({ ...communityPreferences, [questionId]: filtered.length > 0 ? filtered : null });
    } else {
      setCommunityPreferences({ ...communityPreferences, [questionId]: [...current, value] });
    }
  };

  const renderStep4 = () => {
    if (communityLoading) {
      return (
        <View style={styles.communityLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    if (approvedQuestions.length === 0) {
      return (
        <View style={styles.communityEmpty}>
          <Ionicons name="leaf-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.communityEmptyTitle}>{COMMUNITY_DEALBREAKER_COPY.noQuestionsOnboarding.title}</Text>
          <Text style={styles.communityEmptySubtitle}>{COMMUNITY_DEALBREAKER_COPY.noQuestionsOnboarding.subtitle}</Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{COMMUNITY_DEALBREAKER_COPY.onboardingStepTitle}</Text>
        <Text style={styles.communitySubtitle}>{COMMUNITY_DEALBREAKER_COPY.onboardingStepSubtitle}</Text>

        {approvedQuestions.map((question) => (
          <View key={question.id} style={styles.communityQuestion}>
            <Text style={styles.communityQuestionText}>{question.question_text}</Text>

            <Text style={styles.fieldLabel}>{COMMUNITY_DEALBREAKER_COPY.answerPrompt}</Text>
            <View style={styles.chipsContainer}>
              {question.answer_options.map((opt) =>
                renderChip(
                  opt.value,
                  opt.label,
                  communityAnswers[question.id] === opt.value,
                  () => setCommunityAnswers({ ...communityAnswers, [question.id]: opt.value })
                )
              )}
            </View>

            <Text style={styles.fieldLabel}>{COMMUNITY_DEALBREAKER_COPY.preferencePrompt}</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity
                style={[styles.chip, (communityPreferences[question.id] === null || communityPreferences[question.id] === undefined) && styles.chipSelected]}
                onPress={() => setCommunityPreferences({ ...communityPreferences, [question.id]: null })}
              >
                <Text style={[styles.chipText, (communityPreferences[question.id] === null || communityPreferences[question.id] === undefined) && styles.chipTextSelected]}>Any</Text>
              </TouchableOpacity>
              {question.answer_options.map((opt) =>
                renderChip(
                  `pref_${opt.value}`,
                  opt.label,
                  communityPreferences[question.id]?.includes(opt.value) || false,
                  () => toggleCommunityPreference(question.id, opt.value)
                )
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      {editMode ? (
        <View style={styles.editHeader}>
          <TouchableOpacity style={styles.editBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Deal Breakers</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: hasApprovedQuestions ? '50%' : '60%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of {hasApprovedQuestions ? 6 : 5}</Text>
        </View>
      )}

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <View
            key={s}
            style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}
          />
        ))}
      </View>

      {/* Heading */}
      <View style={styles.headingContainer}>
        <Text style={styles.headingTitle}>{ONBOARDING_COPY.dealBreakers.title}</Text>
        <Text style={styles.headingSubtitle}>{ONBOARDING_COPY.dealBreakers.subtitle}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Back"
          onPress={handleBack}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title={step === totalSteps ? (editMode ? 'Save Changes' : 'Next: Add Bio') : (step === 3 && hasApprovedQuestions ? 'Next: Community Rules' : 'Continue')}
          onPress={handleNext}
          loading={isSaving}
          style={styles.nextButton}
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  stepDotDone: {
    backgroundColor: COLORS.primary,
  },
  headingContainer: {
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  headingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  communityLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  communityEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  communityEmptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  communitySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  communityQuestion: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  communityQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
});

export default DealBreakersScreen;
