import { Core } from "../../core/Core";
import { ItemId } from "../../domain/Item";
import { CreateAssessment } from "../../use-case/contribute/assessment/CreateAssessment";
import { AddAssessedItem } from "../../use-case/contribute/assessment/AddAssessedItem";
import { SetQuestion } from "../../use-case/contribute/assessment/SetQuestion";
import { SetAnswers } from "../../use-case/contribute/assessment/SetAnswers";
import { ActivateAssessment } from "../../use-case/contribute/assessment/ActivateAssessment";

export const createMcqFactory = (core: Core) => async (
  name: string,
  items: ItemId[]
) => {
  const { id: assessmentId } = await core.execute(
    CreateAssessment({ type: 'MCQ' })
  )
  for (let i = 0, l = items.length; i < l; i++) {
    await core.execute(AddAssessedItem(assessmentId, items[i]))
  }
  await core.execute(SetQuestion(assessmentId, name + ' question'))
  await core.execute(
    SetAnswers(assessmentId, [{ text: 'A', correct: true }, { text: 'B' }])
  )
  await core.execute(ActivateAssessment(assessmentId))
  return assessmentId
}

export type McqFactory = ReturnType<typeof createMcqFactory>
