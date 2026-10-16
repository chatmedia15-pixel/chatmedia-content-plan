import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contentService } from "@/services/content.service";
import type { ContentItemInput } from "@/types/content";
import type { WorkflowStage } from "@/lib/constants";

export const contentKeys = {
  all: ["content"] as const,
  list: (filters?: { brand_id?: string; workflow_stage?: WorkflowStage }) =>
    ["content", "list", filters] as const,
  detail: (id: string) => ["content", "detail", id] as const,
};

export function useContentItems(filters?: {
  brand_id?: string;
  workflow_stage?: WorkflowStage;
}) {
  return useQuery({
    queryKey: contentKeys.list(filters),
    queryFn: () => contentService.list(filters),
  });
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContentItemInput) => contentService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
    },
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ContentItemInput>;
    }) => contentService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
    },
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
    },
  });
}

export function useMoveStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      publishedUrl,
    }: {
      id: string;
      stage: WorkflowStage;
      publishedUrl?: string;
    }) => contentService.moveStage(id, stage, publishedUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all });
    },
  });
}
