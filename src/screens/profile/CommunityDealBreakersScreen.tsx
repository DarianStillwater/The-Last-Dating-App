import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays } from 'date-fns';

import Button from '../../components/ui/Button';
import CommunitySubmissionCard from '../../components/CommunitySubmissionCard';
import CommunityQuestionRow from '../../components/CommunityQuestionRow';
import { useCommunityDealBreakerStore } from '../../store';
import { COLORS } from '../../constants';
import { COMMUNITY_DEALBREAKER_COPY } from '../../theme/plantMetaphors';
import { useAuthStore } from '../../store';

const CommunityDealBreakersScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore.getState().session?.user?.id;

  const {
    currentCycle,
    submissions,
    approvedQuestions,
    myAnswers,
    myPreferences,
    unansweredQuestions,
    hasSubmittedThisCycle,
    isLoading,
    fetchCurrentCycle,
    fetchSubmissions,
    fetchApprovedQuestions,
    fetchMyAnswers,
    fetchMyPreferences,
    fetchUnansweredQuestions,
    voteForSubmission,
    removeVote,
    subscribeToVotes,
  } = useCommunityDealBreakerStore();

  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentCycle();
      fetchApprovedQuestions();
      fetchMyAnswers();
      fetchMyPreferences();
      fetchUnansweredQuestions();
    }, [])
  );

  useEffect(() => {
    if (currentCycle?.id) {
      fetchSubmissions(currentCycle.id);
      const unsubscribe = subscribeToVotes(currentCycle.id);
      return unsubscribe;
    }
  }, [currentCycle?.id]);

  const daysLeft = currentCycle
    ? Math.max(0, differenceInDays(new Date(currentCycle.ends_at), new Date()))
    : 0;

  const getMyAnswer = (questionId: string) =>
    myAnswers.find((a) => a.question_id === questionId)?.answer_value;

  const getMyPreference = (questionId: string) =>
    myPreferences.find((p) => p.question_id === questionId)?.acceptable_answers;

  const renderHeader = () => (
    <View>
      {/* My Community Answers Section */}
      {approvedQuestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Community Answers</Text>
          {unansweredQuestions.length > 0 && (
            <Text style={styles.unansweredCount}>
              {unansweredQuestions.length} unanswered
            </Text>
          )}
          {approvedQuestions.map((question) => (
            <CommunityQuestionRow
              key={question.id}
              question={question}
              myAnswer={getMyAnswer(question.id)}
              myPreference={getMyPreference(question.id)}
              onAnswerPress={() =>
                navigation.navigate('AnswerCommunityDealBreaker', { questionId: question.id })
              }
              isExpanded={expandedQuestionId === question.id}
              onToggle={() =>
                setExpandedQuestionId(
                  expandedQuestionId === question.id ? null : question.id
                )
              }
            />
          ))}
        </View>
      )}

      {/* Community Voting Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{COMMUNITY_DEALBREAKER_COPY.votePrompt}</Text>
        {currentCycle && (
          <Text style={styles.cycleInfo}>
            {COMMUNITY_DEALBREAKER_COPY.cycleInfo(daysLeft)}
          </Text>
        )}

        {!hasSubmittedThisCycle && currentCycle && (
          <Button
            title={COMMUNITY_DEALBREAKER_COPY.submitPrompt}
            onPress={() =>
              navigation.navigate('CommunityDealBreakerSubmit', { cycleId: currentCycle.id })
            }
            variant="outline"
            style={styles.submitButton}
          />
        )}
      </View>

      {submissions.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={40} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>{COMMUNITY_DEALBREAKER_COPY.emptyState.title}</Text>
          <Text style={styles.emptySubtitle}>{COMMUNITY_DEALBREAKER_COPY.emptyState.subtitle}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{COMMUNITY_DEALBREAKER_COPY.sectionTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && submissions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.submissionPadding}>
              <CommunitySubmissionCard
                questionText={item.question_text}
                voteCount={item.vote_count}
                hasVoted={item.has_voted || false}
                isOwnSubmission={item.submitted_by === userId}
                onVote={() => voteForSubmission(item.id)}
                onUnvote={() => removeVote(item.id)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  unansweredCount: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  cycleInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  submitButton: {
    marginBottom: 8,
  },
  submissionPadding: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CommunityDealBreakersScreen;
