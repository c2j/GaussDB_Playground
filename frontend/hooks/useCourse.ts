// 课程相关 Hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourseService } from "../services";

const courseService = createCourseService();

// 获取所有课程
export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: () => courseService.getCourses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// 获取课程详情
export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseService.getCourseDetail(courseId),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// 获取章节详情
export function useChapterDetail(courseId: string, chapterDir: string) {
  return useQuery({
    queryKey: ["chapter", courseId, chapterDir],
    queryFn: () => courseService.getChapterDetail(courseId, chapterDir),
    enabled: !!courseId && !!chapterDir,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// 获取步骤内容
export function useStepContent(
  courseId: string,
  chapterDir: string,
  stepFile: string
) {
  return useQuery({
    queryKey: ["step", courseId, chapterDir, stepFile],
    queryFn: () => courseService.getStepContent(courseId, chapterDir, stepFile),
    enabled: !!courseId && !!chapterDir && !!stepFile,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// 获取所有专业目录
export function useMajors() {
  return useQuery({
    queryKey: ["majors"],
    queryFn: () => courseService.getMajors(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// 设置当前专业目录
export function useSetCurrentMajor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (majorId: string) => courseService.setCurrentMajor(majorId),
    onSuccess: () => {
      // 切换专业后清空课程缓存
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
      queryClient.invalidateQueries({ queryKey: ["chapter"] });
      queryClient.invalidateQueries({ queryKey: ["step"] });
    },
  });
}
