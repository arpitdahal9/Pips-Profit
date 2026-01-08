// Feelings to emoji mapping
export const FEELING_EMOJIS: Record<string, string> = {
  'Confident': '😌',
  'FOMO': '😬',
  'Angry': '😡',
  'Calm': '🙂',
  'Anxious': '😰',
  'Excited': '🤩',
  'Frustrated': '😤',
  'Relieved': '😌',
  'Greedy': '🤑',
  'Fearful': '😨',
  'Hopeful': '🤞',
  'Disappointed': '😞',
  'Proud': '😊',
  'Nervous': '😟',
  'Euphoric': '😄',
  'Regretful': '😔',
  'Determined': '💪',
  'Uncertain': '🤔',
  'Satisfied': '😎',
  'Stressed': '😓'
};

export const getFeelingEmoji = (feeling: string): string => {
  return FEELING_EMOJIS[feeling] || '😐';
};

export const getAllFeelings = (): string[] => {
  return Object.keys(FEELING_EMOJIS);
};

