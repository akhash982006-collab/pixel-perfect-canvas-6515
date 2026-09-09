export type QuestionType = "MCQ";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctIndex: number;
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  allowOffline: boolean;
  allowMultipleAttempts: boolean;
  enableNegativeMarks: boolean;
}

export interface Quiz {
  id: string;
  code: string;
  title: string;
  subject: string;
  description: string;
  instructions: string;
  teacherName: string;
  teacherId: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startDate?: string;
  endDate?: string;
  settings: QuizSettings;
  questions: Question[];
  version: number;
  published: boolean;
  createdAt: string;
}

export interface OfflineQuiz extends Quiz {
  downloadedAt: string;
  offlineReady: boolean;
}

export type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
export type SyncStatus = "SYNCED" | "PENDING_SYNC" | "SYNC_FAILED";

export interface AttemptAnswer {
  questionId: string;
  selectedIndex: number | null;
  markedForReview: boolean;
  updatedAt: string;
}

export interface Attempt {
  attemptId: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  studentName: string;
  registerNumber: string;
  startTime: string;
  endTime?: string;
  deadline: string;
  status: AttemptStatus;
  syncStatus: SyncStatus;
  answers: Record<string, AttemptAnswer>;
  score?: number;
  correct?: number;
  wrong?: number;
  unanswered?: number;
  percentage?: number;
  passed?: boolean;
  quizVersion: number;
}
