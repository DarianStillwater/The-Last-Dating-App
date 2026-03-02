import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/ui/Input';
import { useProfileStore } from '../../store';
import {
  COLORS,
  GENDER_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  OFFSPRING_OPTIONS,
  SMOKER_OPTIONS,
  ALCOHOL_OPTIONS,
  DRUGS_OPTIONS,
  DIET_OPTIONS,
  INCOME_OPTIONS,
  HEIGHT_RANGE,
  cmToFeetInches,
  APP_CONFIG,
} from '../../constants';

const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, updateProfile, isLoading } = useProfileStore();

  const [firstName, setFirstName] = useState('');
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
  const [bio, setBio] = useState('');
  const [thingsToKnow, setThingsToKnow] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setGender(profile.gender || '');
      setLookingFor(profile.looking_for || []);
      setHeightCm(profile.height_cm || 170);
      setEthnicity(profile.ethnicity || '');
      setReligion(profile.religion || '');
      setOffspring(profile.offspring || '');
      setSmoker(profile.smoker || '');
      setAlcohol(profile.alcohol || '');
      setDrugs(profile.drugs || '');
      setDiet(profile.diet || '');
      setOccupation(profile.occupation || '');
      setIncome(profile.income || '');
      setBio(profile.bio || '');
      setThingsToKnow(profile.things_to_know || '');
    }
  }, [profile]);

  const toggleLookingFor = (value: string) => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((v) => v !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  const canSave =
    firstName.length >= 2 &&
    gender !== '' &&
    lookingFor.length > 0 &&
    ethnicity !== '' &&
    religion !== '' &&
    offspring !== '' &&
    smoker !== '' &&
    alcohol !== '' &&
    drugs !== '' &&
    diet !== '';

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    const { error } = await updateProfile({
      first_name: firstName,
      gender: gender as any,
      looking_for: lookingFor as any,
      height_cm: heightCm,
      ethnicity: ethnicity as any,
      religion: religion as any,
      offspring: offspring as any,
      smoker: smoker as any,
      alcohol: alcohol as any,
      drugs: drugs as any,
      diet: diet as any,
      occupation: occupation || undefined,
      income: income ? (income as any) : undefined,
      bio: bio || undefined,
      things_to_know: thingsToKnow || undefined,
    });
    setIsSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      navigation.goBack();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Name</Text>
        <Input
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.optionsGrid}>
          {GENDER_OPTIONS.map((opt) =>
            renderOption(opt.value, opt.label, gender === opt.value, () => setGender(opt.value))
          )}
        </View>

        <Text style={styles.sectionTitle}>Looking For</Text>
        <View style={styles.optionsGrid}>
          {LOOKING_FOR_OPTIONS.map((opt) =>
            renderOption(opt.value, opt.label, lookingFor.includes(opt.value), () =>
              toggleLookingFor(opt.value)
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>Height</Text>
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
            renderOption(opt.value, opt.label, ethnicity === opt.value, () =>
              setEthnicity(opt.value)
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>Religion</Text>
        <View style={styles.optionsList}>
          {RELIGION_OPTIONS.map((opt) =>
            renderOption(opt.value, opt.label, religion === opt.value, () =>
              setReligion(opt.value)
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>Children</Text>
        <View style={styles.optionsList}>
          {OFFSPRING_OPTIONS.map((opt) =>
            renderOption(opt.value, opt.label, offspring === opt.value, () =>
              setOffspring(opt.value)
            )
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

        <Text style={styles.sectionTitle}>Occupation (Optional)</Text>
        <Input
          placeholder="What do you do?"
          value={occupation}
          onChangeText={setOccupation}
        />

        <Text style={styles.sectionTitle}>Income (Optional)</Text>
        <View style={styles.optionsList}>
          {INCOME_OPTIONS.map((opt) =>
            renderOption(opt.value, opt.label, income === opt.value, () => setIncome(opt.value))
          )}
        </View>

        <Text style={styles.sectionTitle}>Bio</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Tell people about yourself..."
            placeholderTextColor={COLORS.textLight}
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, APP_CONFIG.MAX_BIO_LENGTH))}
            multiline
            maxLength={APP_CONFIG.MAX_BIO_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>
            {bio.length}/{APP_CONFIG.MAX_BIO_LENGTH}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Things to Know</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Anything else people should know..."
            placeholderTextColor={COLORS.textLight}
            value={thingsToKnow}
            onChangeText={(text) =>
              setThingsToKnow(text.slice(0, APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH))
            }
            multiline
            maxLength={APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>
            {thingsToKnow.length}/{APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH}
          </Text>
        </View>
      </ScrollView>
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
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
  },
  saveButtonTextDisabled: {
    color: COLORS.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
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
  textAreaContainer: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
});

export default EditProfileScreen;
