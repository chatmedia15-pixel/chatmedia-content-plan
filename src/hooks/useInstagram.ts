import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instagramService } from "@/services/instagram.service";

export function useInstagramSnapshots() {
  return useQuery({
    queryKey: ["instagram", "latest"],
    queryFn: () => instagramService.getLatestSnapshots(),
  });
}

export function useSyncInstagram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brands: string[]) => instagramService.sync(brands),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instagram"] });
    },
  });
}
