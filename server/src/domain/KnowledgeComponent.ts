export type KnowledgeComponentId = 'KnowledgeComponentId'

export interface KnowledgeComponentFields {
  name: string
  description?: string
}

export interface KnowledgeComponent extends KnowledgeComponentFields {
  id: KnowledgeComponentId
}
