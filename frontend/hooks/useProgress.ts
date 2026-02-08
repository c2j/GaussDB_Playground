// 进度相关 Hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProgressService } from "../services";

const progressService = createProgressService();

// 获取用户进度
export function useUserProgress(userId: string) {
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => progressService.getProgress(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// 获取课程进度
export function useCourseProgress(userId: string, courseId: string) {
  return useQuery({
    queryKey: ["courseProgress", userId, courseId],
    queryFn: () => progressService.getCourseProgress(userId, courseId),
    enabled: !!userId && !!courseId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// 标记步骤完成
export function useMarkStepComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      courseId: string;
      chapterId: string;
      stepId: string;
    }) => {
      await progressService.markStepComplete(
        params.userId,
        params.courseId,
        params.chapterId,
        params.stepId
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", variables.userId, variables.courseId],
      });
    },
  });
}

// 重置课程进度
export function useResetCourseProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; courseId: string }) => {
      await progressService.resetCourseProgress(
        params.userId,
        params.courseId
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseProgress", variables.userId, variables.courseId],
      });
    },
  });
}
