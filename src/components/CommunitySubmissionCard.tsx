import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import AnimatedPress from './ui/AnimatedPress';
import AnimatedCounter from './ui/AnimatedCounter';

interface CommunitySubmissionCardProps {
  questionText: string;
  voteCount: number;
  hasVoted: boolean;
  isOwnSubmission: boolean;
  onVote: () => void;
  onUnvote: () => void;
}

const CommunitySubmissionCard: React.FC<CommunitySubmissionCardProps> = ({
  questionText,
  voteCount,
  hasVoted,
  isOwnSubmission,
  onVote,
  onUnvote,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.questionText}>{questionText}</Text>
        {isOwnSubmission && (
          <Text style={styles.ownBadge}>Your submission</Text>
        )}
      </View>
      <AnimatedPress
        feedbackAction="vote"
        onPress={hasVoted ? onUnvote : onVote}
        style={[styles.voteButton, hasVoted && styles.voteButtonActive]}
      >
        <Ionicons
          name={hasVoted ? 'arrow-up' : 'arrow-up-outline'}
          size={18}
          color={hasVoted ? COLORS.background : COLORS.primary}
        />
        <AnimatedCounter
          value={voteCount}
          style={[styles.voteCount, hasVoted && styles.voteCountActive]}
        />
      </AnimatedPress>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  ownBadge: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  voteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 56,
  },
  voteButtonActive: {
    backgroundColor: COLORS.primary,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  voteCountActive: {
    color: COLORS.background,
  },
});

export default CommunitySubmissionCard;
