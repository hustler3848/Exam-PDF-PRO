export interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

// Type for questions extracted by AI, which don't have the correct answer yet.
export interface ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
  // The accuracy assessment from the user's perspective of the answer key
  accuracyAssessment: string; 
}
