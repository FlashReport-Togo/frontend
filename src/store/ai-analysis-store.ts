import { create } from "zustand";

export interface AiAnalysisResult {
  tendances?: string[];
  anomalies?: string[];
  synthese?: string;
  [key: string]: unknown;
}

interface AiAnalysisState {
  results: Record<string, AiAnalysisResult>;
  setResult: (reportId: string, result: AiAnalysisResult) => void;
}

export const useAiAnalysisStore = create<AiAnalysisState>((set) => ({
  results: {},
  setResult: (reportId, result) =>
    set((state) => ({ results: { ...state.results, [reportId]: result } })),
}));
