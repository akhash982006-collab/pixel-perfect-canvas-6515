import { useQuery } from "@tanstack/react-query";
import { listCloudAttempts, listCloudAttemptsByQuiz, listTeacherQuizzes } from "@/lib/cloud";
import { useAuth } from "./use-auth";

/** Submitted attempts for one quiz only. */
export function useQuizAttempts(quizId?: string | null) {
  return useQuery({
    queryKey: ["quiz-attempts", quizId],
    enabled: Boolean(quizId),
    queryFn: () => listCloudAttemptsByQuiz(quizId!),
  });
}

export function useTeacherQuizzes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-quizzes", user?.uid],
    enabled: Boolean(user),
    queryFn: () => listTeacherQuizzes(user!.uid),
  });
}

export function useTeacherAttempts(quizIds: string[]) {
  return useQuery({
    queryKey: ["admin-attempts", quizIds.slice().sort().join(",")],
    enabled: quizIds.length >= 0,
    queryFn: () => listCloudAttempts(quizIds),
  });
}
