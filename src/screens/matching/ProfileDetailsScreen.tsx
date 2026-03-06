import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GENDER_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  OFFSPRING_OPTIONS,
  SMOKER_OPTIONS,
  ALCOHOL_OPTIONS,
  DRUGS_OPTIONS,
  DIET_OPTIONS,
  INCOME_OPTIONS,
} from '../../constants';
import type { UserProfile } from '../../types';

const ProfileDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data as UserProfile | null);
      setIsLoading(false);
    };
    load();
  }, [userId]);

  const getLabel = (options: { value: string; label: string }[], value: string | undefined | null) =>
    value ? options.find((o) => o.value === value)?.label || value : null;

  const renderRow = (label: string, value: string | undefined | null) => {
    if (!value) return null;
    return (
      <View style={styles.row} key={label}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    );
  };

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
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
        <Text style={styles.headerTitle}>{profile.first_name}'s Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          {renderRow('Gender', getLabel(GENDER_OPTIONS, profile.gender))}
          {renderRow('Ethnicity', getLabel(ETHNICITY_OPTIONS, profile.ethnicity))}
          {renderRow('Religion', getLabel(RELIGION_OPTIONS, profile.religion))}
          {renderRow('Children', getLabel(OFFSPRING_OPTIONS, profile.offspring))}
          {renderRow('Smoking', getLabel(SMOKER_OPTIONS, profile.smoker))}
          {renderRow('Drinking', getLabel(ALCOHOL_OPTIONS, profile.alcohol))}
          {renderRow('Drugs', getLabel(DRUGS_OPTIONS, profile.drugs))}
          {renderRow('Diet', getLabel(DIET_OPTIONS, profile.diet))}
          {renderRow('Occupation', profile.occupation)}
          {renderRow('Income', getLabel(INCOME_OPTIONS, profile.income))}
        </View>

        {profile.things_to_know ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Things to Know</Text>
            <Text style={styles.bodyText}>{profile.things_to_know}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
});

export default ProfileDetailsScreen;
