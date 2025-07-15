export interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
  accuracyAssessment: string;
}
