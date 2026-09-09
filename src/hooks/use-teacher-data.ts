import { useQuery } from "@tanstack/react-query";
import { listCloudAttempts, listTeacherQuizzes } from "@/lib/cloud";
import { useTeacherAuth } from "./use-teacher-auth";

export function useTeacherQuizzes() {
  const { teacher } = useTeacherAuth();
  return useQuery({
    queryKey: ["teacher-quizzes", teacher?.uid],
    enabled: Boolean(teacher),
    queryFn: () => listTeacherQuizzes(teacher!.uid),
  });
}

export function useTeacherAttempts(quizIds: string[]) {
  return useQuery({
    queryKey: ["teacher-attempts", quizIds.slice().sort().join(",")],
    enabled: quizIds.length >= 0,
    queryFn: () => listCloudAttempts(quizIds),
  });
}
