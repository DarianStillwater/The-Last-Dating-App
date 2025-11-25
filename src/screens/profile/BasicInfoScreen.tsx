import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { COLORS, GENDER_OPTIONS, LOOKING_FOR_OPTIONS, ETHNICITY_OPTIONS, RELIGION_OPTIONS, OFFSPRING_OPTIONS, SMOKER_OPTIONS, ALCOHOL_OPTIONS, DRUGS_OPTIONS, DIET_OPTIONS, INCOME_OPTIONS, HEIGHT_RANGE, cmToFeetInches } from '../../constants';

const BasicInfoScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [heightCm, setHeightCm] = useState(170);
  const [ethnicity, setEthnicity] = useState('');
  const [religion, setReligion] = useState('');
  const [offspring, setOffspring] = useState('');
  const [smoker, setSmoker] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [drugs, setDrugs] = useState('');
  const [diet, setDiet] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const toggleLookingFor = (value: string) => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((v) => v !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return firstName.length >= 2 && gender && lookingFor.length > 0;
      case 2:
        return ethnicity && religion;
      case 3:
        return offspring && smoker && alcohol && drugs && diet;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigation.navigate('Photos', {
        profileData: {
          first_name: firstName,
          birth_date: birthDate.toISOString().split('T')[0],
          gender,
          looking_for: lookingFor,
          height_cm: heightCm,
          ethnicity,
          religion,
          offspring,
          smoker,
          alcohol,
          drugs,
          diet,
          occupation: occupation || null,
          income: income || null,
        },
      });
    }
  };

  const renderOption = (value: string, label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={value}
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>What's your name?</Text>
      <Input
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoFocus
      />

      <Text style={styles.sectionTitle}>When's your birthday?</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
        <Text style={styles.dateText}>
          {birthDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) setBirthDate(date);
          }}
        />
      )}

      <Text style={styles.sectionTitle}>I am a...</Text>
      <View style={styles.optionsGrid}>
        {GENDER_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, gender === opt.value, () => setGender(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>I'm interested in...</Text>
      <View style={styles.optionsGrid}>
        {LOOKING_FOR_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, lookingFor.includes(opt.value), () => toggleLookingFor(opt.value))
        )}
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>How tall are you?</Text>
      <View style={styles.heightContainer}>
        <TouchableOpacity
          style={styles.heightButton}
          onPress={() => setHeightCm(Math.max(HEIGHT_RANGE.MIN_CM, heightCm - 1))}
        >
          <Ionicons name="remove" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.heightDisplay}>
          <Text style={styles.heightValue}>{cmToFeetInches(heightCm)}</Text>
          <Text style={styles.heightCm}>{heightCm} cm</Text>
        </View>
        <TouchableOpacity
          style={styles.heightButton}
          onPress={() => setHeightCm(Math.min(HEIGHT_RANGE.MAX_CM, heightCm + 1))}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ethnicity</Text>
      <View style={styles.optionsList}>
        {ETHNICITY_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, ethnicity === opt.value, () => setEthnicity(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>Religion</Text>
      <View style={styles.optionsList}>
        {RELIGION_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, religion === opt.value, () => setReligion(opt.value))
        )}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.sectionTitle}>Children</Text>
      <View style={styles.optionsList}>
        {OFFSPRING_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, offspring === opt.value, () => setOffspring(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>Smoking</Text>
      <View style={styles.optionsGrid}>
        {SMOKER_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, smoker === opt.value, () => setSmoker(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>Drinking</Text>
      <View style={styles.optionsGrid}>
        {ALCOHOL_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, alcohol === opt.value, () => setAlcohol(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>Drugs</Text>
      <View style={styles.optionsGrid}>
        {DRUGS_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, drugs === opt.value, () => setDrugs(opt.value))
        )}
      </View>

      <Text style={styles.sectionTitle}>Diet</Text>
      <View style={styles.optionsGrid}>
        {DIET_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, diet === opt.value, () => setDiet(opt.value))
        )}
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.sectionTitle}>What do you do? (Optional)</Text>
      <Input
        placeholder="Occupation"
        value={occupation}
        onChangeText={setOccupation}
      />

      <Text style={styles.sectionTitle}>Income (Optional)</Text>
      <View style={styles.optionsList}>
        {INCOME_OPTIONS.map((opt) =>
          renderOption(opt.value, opt.label, income === opt.value, () => setIncome(opt.value))
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 1 && (
          <Button
            title="Back"
            onPress={() => setStep(step - 1)}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={step === totalSteps ? 'Next: Add Photos' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed()}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsList: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    minWidth: '48%',
    flexGrow: 1,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '15',
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
  },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  heightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  heightDisplay: {
    alignItems: 'center',
  },
  heightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  heightCm: {
    fontSize: 14,
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
});

export default BasicInfoScreen;
