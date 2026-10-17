import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ideaBankService, type BankIdea } from "@/services/idea-bank.service";

export const bankKeys = {
  all: ["idea-bank"] as const,
  list: (brand_id?: string) => ["idea-bank", "list", brand_id] as const,
};

export function useIdeaBank(brand_id?: string) {
  return useQuery({
    queryKey: bankKeys.list(brand_id),
    queryFn: () => ideaBankService.list(brand_id),
  });
}

export function useSaveToBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      idea: Partial<import("@/services/idea-bank.service").BankIdea>,
    ) => ideaBankService.saveToBank(idea as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: bankKeys.all }),
  });
}

export function useDeleteFromBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ideaBankService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bankKeys.all }),
  });
}

export function useSendFromBankToPlanning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankIdea,
      plannedDate,
    }: {
      bankIdea: BankIdea;
      plannedDate: string;
    }) => ideaBankService.sendToPlanningFromBank(bankIdea, plannedDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bankKeys.all });
      qc.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

// Re-export BankIdea agar bisa di-import dari hooks
export type { BankIdea };
