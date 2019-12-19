import { Core } from '../../core/Core'
import {
  KnowledgeComponentId,
  LearningObjectiveId
} from '../../domain/LearningObjective'
import { ActivateAssessment } from '../../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedComponent } from '../../use-case/contribute/assessment/AddAssessedComponent'
import { AddPrerequisite } from '../../use-case/contribute/assessment/AddPrerequisite'
import { CreateAssessment } from '../../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../../use-case/contribute/assessment/SetQuestion'

export const createMcqFactory = (core: Core) => async (
  name: string,
  items: KnowledgeComponentId[],
  options?: {
    prerequisites?: LearningObjectiveId[]
  }
) => {
  const { id: assessmentId } = await core.execute(
    CreateAssessment({ type: 'MCQ' })
  )
  for (let i = 0, l = items.length; i < l; i++) {
    await core.execute(AddAssessedComponent(assessmentId, items[i]))
  }
  await core.execute(SetQuestion(assessmentId, name + ' question'))
  await core.execute(
    SetAnswers(assessmentId, [{ text: 'A', correct: true }, { text: 'B' }])
  )
  await core.execute(ActivateAssessment(assessmentId))
  if (options) {
    if (options.prerequisites) {
      for (let i = 0, l = options.prerequisites.length; i < l; i++) {
        await core.execute(
          AddPrerequisite(assessmentId, options.prerequisites[i])
        )
      }
    }
  }
  return assessmentId
}

export type McqFactory = ReturnType<typeof createMcqFactory>
