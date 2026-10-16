import { useQuery } from "@tanstack/react-query";
import { brandsService } from "@/services/brands.service";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsService.list(),
    staleTime: 5 * 60 * 1000, // 5 menit
  });
}
