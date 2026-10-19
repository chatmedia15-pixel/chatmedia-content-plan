import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ideasService } from "@/services/ideas.service";
import type { ContentIdea, ContentIdeaInput } from "@/types/content";

export const ideasKeys = {
  all: ["ideas"] as const,
  list: (brand_id?: string) => ["ideas", "list", brand_id] as const,
};

export function useContentIdeas(brand_id?: string) {
  return useQuery({
    queryKey: ideasKeys.list(brand_id),
    queryFn: () => ideasService.list(brand_id),
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContentIdeaInput) => ideasService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ideasKeys.all }),
  });
}

export function useUpdateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ContentIdeaInput>;
    }) => ideasService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ideasKeys.all }),
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ideasService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ideasKeys.all }),
  });
}

export function useSendIdeaToPlanning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idea,
      plannedDate,
    }: {
      idea: ContentIdea;
      plannedDate?: string | null;
    }) => ideasService.sendToPlanning(idea, plannedDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ideasKeys.all });
      qc.invalidateQueries({ queryKey: ["content"] });
    },
  });
}
