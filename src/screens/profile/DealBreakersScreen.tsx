import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import Button from '../../components/ui/Button';
import { COLORS, ETHNICITY_OPTIONS, RELIGION_OPTIONS, OFFSPRING_OPTIONS, SMOKER_OPTIONS, ALCOHOL_OPTIONS, DIET_OPTIONS, DISTANCE_OPTIONS, cmToFeetInches, AGE_RANGE, HEIGHT_RANGE } from '../../constants';

const DealBreakersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const profileData = route.params?.profileData || {};

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

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const renderSection = (
    title: string,
    key: string,
    summary: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSection === key;
    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : key)}
        >
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSummary}>{summary}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{content}</View>}
      </View>
    );
  };

  const handleNext = () => {
    navigation.navigate('Bio', {
      profileData,
      dealBreakers: {
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
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressText}>Step 3 of 4</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your deal breakers</Text>
        <Text style={styles.subtitle}>
          We only show you profiles that match your criteria, and you'll only appear to people whose criteria you match.
        </Text>

        {/* Age Range */}
        {renderSection(
          'Age Range',
          'age',
          `${minAge} - ${maxAge} years old`,
          <View style={styles.rangeContainer}>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeValue}>{minAge}</Text>
              <Text style={styles.rangeValue}>{maxAge}</Text>
            </View>
            <View style={styles.sliderContainer}>
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
            </View>
          </View>
        )}

        {/* Height Range */}
        {renderSection(
          'Height',
          'height',
          `${cmToFeetInches(minHeight)} - ${cmToFeetInches(maxHeight)}`,
          <View style={styles.rangeContainer}>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeValue}>{cmToFeetInches(minHeight)}</Text>
              <Text style={styles.rangeValue}>{cmToFeetInches(maxHeight)}</Text>
            </View>
            <View style={styles.sliderContainer}>
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
            </View>
          </View>
        )}

        {/* Distance */}
        {renderSection(
          'Distance',
          'distance',
          maxDistance >= 500 ? 'Anywhere' : `Within ${maxDistance} miles`,
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
        )}

        {/* Ethnicity */}
        {renderSection(
          'Ethnicity',
          'ethnicity',
          ethnicities.length === 0 ? 'Any' : `${ethnicities.length} selected`,
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
        )}

        {/* Religion */}
        {renderSection(
          'Religion',
          'religion',
          religions.length === 0 ? 'Any' : `${religions.length} selected`,
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
        )}

        {/* Children */}
        {renderSection(
          'Children',
          'offspring',
          offspring.length === 0 ? 'Any' : `${offspring.length} selected`,
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
        )}

        {/* Smoking */}
        {renderSection(
          'Smoking',
          'smoker',
          smoker.length === 0 ? 'Any' : `${smoker.length} selected`,
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
        )}

        {/* Alcohol */}
        {renderSection(
          'Drinking',
          'alcohol',
          alcohol.length === 0 ? 'Any' : `${alcohol.length} selected`,
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
        )}

        {/* Diet */}
        {renderSection(
          'Diet',
          'diet',
          diet.length === 0 ? 'Any' : `${diet.length} selected`,
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
        )}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.noteText}>
            Leave sections empty to see all options. Remember: you'll only see people who also match your profile.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Next: Add Bio"
          onPress={handleNext}
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
    paddingVertical: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  rangeContainer: {
    gap: 8,
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
  sliderContainer: {
    gap: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
});

export default DealBreakersScreen;
