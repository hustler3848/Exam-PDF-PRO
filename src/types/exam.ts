export interface ExamQuestion {
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

export interface ExamData {
  title: string;
  questions: ExamQuestion[];
  // The accuracy assessment from the user's perspective of the answer key
  accuracyAssessment: string; 
}
