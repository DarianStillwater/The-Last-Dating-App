import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  LOOKING_FOR_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  OFFSPRING_OPTIONS,
  SMOKER_OPTIONS,
  ALCOHOL_OPTIONS,
  DRUGS_OPTIONS,
  DIET_OPTIONS,
  INCOME_OPTIONS,
  APP_CONFIG,
} from '../../constants';
import { triggerFeedback } from '../../services/feedback';
import { useToast } from '../../components/ui/Toast';

type Section = 'preferences' | 'background' | 'lifestyle' | 'professional' | 'about';

const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, updateProfile } = useProfileStore();
  const { showToast } = useToast();

  const [lookingFor, setLookingFor] = useState<string[]>([]);
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
  const [expandedSection, setExpandedSection] = useState<Section>('preferences');

  useEffect(() => {
    if (profile) {
      setLookingFor(profile.looking_for || []);
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
      looking_for: lookingFor as any,
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
      triggerFeedback('error');
      Alert.alert('Error', error);
    } else {
      triggerFeedback('save');
      showToast('Profile saved!');
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
      {selected && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  const getLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label || value;

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? 'preferences' : section);
  };

  const SectionHeader = ({ title, section, summary }: { title: string; section: Section; summary: string }) => (
    <TouchableOpacity
      style={[styles.sectionHeader, expandedSection === section && styles.sectionHeaderActive]}
      onPress={() => toggleSection(section)}
    >
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {expandedSection !== section && <Text style={styles.sectionSummary}>{summary}</Text>}
      </View>
      <Ionicons
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={COLORS.textSecondary}
      />
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

      <View style={styles.contentArea}>
        {/* Preferences */}
        <SectionHeader title="Looking For" section="preferences" summary={lookingFor.map((v) => getLabel(LOOKING_FOR_OPTIONS, v)).join(', ') || 'Not set'} />
        {expandedSection === 'preferences' && (
          <View style={styles.sectionContent}>
            <View style={styles.optionsGrid}>
              {LOOKING_FOR_OPTIONS.map((opt) => renderOption(opt.value, opt.label, lookingFor.includes(opt.value), () => toggleLookingFor(opt.value)))}
            </View>
          </View>
        )}

        {/* Background */}
        <SectionHeader title="Background" section="background" summary={[getLabel(ETHNICITY_OPTIONS, ethnicity), getLabel(RELIGION_OPTIONS, religion)].filter(Boolean).join(', ')} />
        {expandedSection === 'background' && (
          <View style={styles.sectionContent}>
            <Text style={styles.fieldLabel}>Ethnicity</Text>
            <View style={styles.optionsGrid}>
              {ETHNICITY_OPTIONS.map((opt) => renderOption(opt.value, opt.label, ethnicity === opt.value, () => setEthnicity(opt.value)))}
            </View>
            <Text style={styles.fieldLabel}>Religion</Text>
            <View style={styles.optionsGrid}>
              {RELIGION_OPTIONS.map((opt) => renderOption(opt.value, opt.label, religion === opt.value, () => setReligion(opt.value)))}
            </View>
            <Text style={styles.fieldLabel}>Children</Text>
            <View style={styles.optionsGrid}>
              {OFFSPRING_OPTIONS.map((opt) => renderOption(opt.value, opt.label, offspring === opt.value, () => setOffspring(opt.value)))}
            </View>
          </View>
        )}

        {/* Lifestyle */}
        <SectionHeader title="Lifestyle" section="lifestyle" summary={[getLabel(SMOKER_OPTIONS, smoker), getLabel(ALCOHOL_OPTIONS, alcohol), getLabel(DIET_OPTIONS, diet)].filter(Boolean).join(', ')} />
        {expandedSection === 'lifestyle' && (
          <View style={styles.sectionContent}>
            <Text style={styles.fieldLabel}>Smoking</Text>
            <View style={styles.optionsGrid}>
              {SMOKER_OPTIONS.map((opt) => renderOption(opt.value, opt.label, smoker === opt.value, () => setSmoker(opt.value)))}
            </View>
            <Text style={styles.fieldLabel}>Drinking</Text>
            <View style={styles.optionsGrid}>
              {ALCOHOL_OPTIONS.map((opt) => renderOption(opt.value, opt.label, alcohol === opt.value, () => setAlcohol(opt.value)))}
            </View>
            <Text style={styles.fieldLabel}>Drugs</Text>
            <View style={styles.optionsGrid}>
              {DRUGS_OPTIONS.map((opt) => renderOption(opt.value, opt.label, drugs === opt.value, () => setDrugs(opt.value)))}
            </View>
            <Text style={styles.fieldLabel}>Diet</Text>
            <View style={styles.optionsGrid}>
              {DIET_OPTIONS.map((opt) => renderOption(opt.value, opt.label, diet === opt.value, () => setDiet(opt.value)))}
            </View>
          </View>
        )}

        {/* Professional */}
        <SectionHeader title="Professional" section="professional" summary={occupation || 'Not set'} />
        {expandedSection === 'professional' && (
          <View style={styles.sectionContent}>
            <Input placeholder="Occupation" value={occupation} onChangeText={setOccupation} />
            <Text style={styles.fieldLabel}>Income</Text>
            <View style={styles.optionsGrid}>
              {INCOME_OPTIONS.map((opt) => renderOption(opt.value, opt.label, income === opt.value, () => setIncome(opt.value)))}
            </View>
          </View>
        )}

        {/* About */}
        <SectionHeader title="About" section="about" summary={bio ? `${bio.slice(0, 30)}...` : 'Not set'} />
        {expandedSection === 'about' && (
          <View style={styles.sectionContent}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell people about yourself..."
              placeholderTextColor={COLORS.textLight}
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, APP_CONFIG.MAX_BIO_LENGTH))}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.fieldLabel}>Things to Know</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 60 }]}
              placeholder="Anything else people should know..."
              placeholderTextColor={COLORS.textLight}
              value={thingsToKnow}
              onChangeText={(text) => setThingsToKnow(text.slice(0, APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH))}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}
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
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderActive: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSummary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionContent: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
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
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;
