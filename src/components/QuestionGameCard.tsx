import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_CONFIG } from '../constants';
import Button from './ui/Button';
import type { QuestionGame } from '../types';

interface QuestionGameCardProps {
  game: QuestionGame;
  currentUserId: string;
  otherUserName: string;
  onAnswer: (gameId: string, answer: string) => Promise<{ error: string | null }>;
}

const QuestionGameCard: React.FC<QuestionGameCardProps> = ({
  game,
  currentUserId,
  otherUserName,
  onAnswer,
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myAnswer = game.answers?.find((a) => a.user_id === currentUserId);
  const otherAnswer = game.answers?.find((a) => a.user_id !== currentUserId);
  const hasAnswered = !!myAnswer;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    await onAnswer(game.id, answer);
    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="game-controller" size={20} color={COLORS.secondary} />
        <Text style={styles.headerText}>Question Game</Text>
      </View>

      <Text style={styles.question}>{game.question}</Text>

      {game.status === 'revealed' && myAnswer && otherAnswer ? (
        <View style={styles.answersContainer}>
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>You</Text>
            <Text style={styles.answerText}>{myAnswer.answer}</Text>
          </View>
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>{otherUserName}</Text>
            <Text style={styles.answerText}>{otherAnswer.answer}</Text>
          </View>
        </View>
      ) : game.status === 'waiting' && hasAnswered ? (
        <View style={styles.waitingContainer}>
          <Ionicons name="hourglass-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.waitingText}>
            Waiting for {otherUserName} to answer...
          </Text>
        </View>
      ) : !hasAnswered ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            placeholderTextColor={COLORS.textSecondary}
            value={answer}
            onChangeText={setAnswer}
            maxLength={APP_CONFIG.GAME_MAX_ANSWER_LENGTH}
            multiline
            numberOfLines={3}
          />
          <Button
            title="Submit"
            onPress={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            loading={isSubmitting}
            size="small"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary + '10',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  question: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  answersContainer: {
    gap: 12,
  },
  answerBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  waitingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    gap: 10,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default QuestionGameCard;
