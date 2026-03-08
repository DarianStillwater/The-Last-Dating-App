import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import type { CommunityDealBreakerQuestion } from '../types';

interface CommunityQuestionRowProps {
  question: CommunityDealBreakerQuestion;
  myAnswer?: string;
  myPreference?: string[] | null;
  onAnswerPress: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const CommunityQuestionRow: React.FC<CommunityQuestionRowProps> = ({
  question,
  myAnswer,
  myPreference,
  onAnswerPress,
  isExpanded,
  onToggle,
}) => {
  const answerLabel = myAnswer
    ? question.answer_options.find((o) => o.value === myAnswer)?.label || myAnswer
    : null;

  const prefLabels = myPreference
    ? myPreference.map((v) => question.answer_options.find((o) => o.value === v)?.label || v)
    : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <View style={styles.headerContent}>
          <Text style={styles.questionText}>{question.question_text}</Text>
          {!myAnswer && (
            <View style={styles.unansweredBadge}>
              <Text style={styles.unansweredBadgeText}>New</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {myAnswer ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Your answer:</Text>
                <Text style={styles.infoValue}>{answerLabel}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Match preference:</Text>
                <Text style={styles.infoValue}>
                  {prefLabels ? prefLabels.join(', ') : 'Any'}
                </Text>
              </View>
            </>
          ) : null}
          <TouchableOpacity style={styles.actionButton} onPress={onAnswerPress}>
            <Text style={styles.actionButtonText}>
              {myAnswer ? 'Edit Answer' : 'Answer Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  unansweredBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unansweredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.background,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default CommunityQuestionRow;
