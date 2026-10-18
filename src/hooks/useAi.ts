import { useMutation } from "@tanstack/react-query";
import {
  aiService,
  type GenerateIdeasInput,
  type GenerateCaptionInput,
  type AnalyzeInsightsInput,
} from "@/services/ai.service";

export function useGenerateIdeas() {
  return useMutation({
    mutationFn: (input: GenerateIdeasInput) =>
      aiService.generateContentIdeas(input),
  });
}

export function useGenerateCaption() {
  return useMutation({
    mutationFn: (input: GenerateCaptionInput) =>
      aiService.generateCaption(input),
  });
}

export function useAnalyzeInsights() {
  return useMutation({
    mutationFn: (input: AnalyzeInsightsInput) =>
      aiService.analyzeInsights(input),
  });
}

export function useChatAssistant() {
  return useMutation({
    mutationFn: (input: { brand: string; message: string }) =>
      aiService.chatAssistant(input),
  });
}
