export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'

export interface ScoreRule {
  points: number
  penalty: number
}

// Anti-Glueck Punkte-System aus dem Konzept (Leicht .. Extrem)
export const SCORING: Record<Difficulty, ScoreRule> = {
  easy: { points: 10, penalty: 5 },
  medium: { points: 25, penalty: 10 },
  hard: { points: 50, penalty: 25 },
  extreme: { points: 100, penalty: 50 },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'extreme']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
  extreme: 'Extrem',
}

export function pointsFor(difficulty: Difficulty): number {
  return SCORING[difficulty].points
}

export function penaltyFor(difficulty: Difficulty): number {
  return SCORING[difficulty].penalty
}

export function difficultyFromPoints(points: number): Difficulty {
  const found = DIFFICULTY_ORDER.find((d) => SCORING[d].points === points)
  return found ?? 'medium'
}
