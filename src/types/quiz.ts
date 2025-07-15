export interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  accuracyAssessment: string;
}
