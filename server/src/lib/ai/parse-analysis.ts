export type AnalysisItemBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnalysisItem = {
  name: string;
  description: string;
  quantity: number;
  sourceImageIndex: number | null;
  bbox: AnalysisItemBoundingBox | null;
};

export type ParsedAnalysisResult = {
  items: AnalysisItem[];
  rawResponse: string;
  parseError: string | null;
};

export function parseAnalysis(rawResponse: string): ParsedAnalysisResult {
  return {
    items: [],
    rawResponse,
    parseError: "Parser skeleton not implemented yet.",
  };
}
