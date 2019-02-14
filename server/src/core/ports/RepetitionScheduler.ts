import { KnowledgeComponentId } from "../../domain/KnowledgeComponent";

export interface RepetitionScheduler {
  next: (params?: {
    passed: boolean
    assessedComponents: Array<{
      id: KnowledgeComponentId
    }>
    history: Array<{ passed: boolean; time: number }>
  }) => Promise<number>
}
