import { createActivateAssessmentGateway } from './ActivateAssessment'
import { createAddAssessedItemGateway } from './AddAssessedItem'
import { createCreateAssessmentGateway } from './CreateAssessment'
import { createSetAnswersGateway } from './SetAnswers'
import { createSetQuestionGateway } from './SetQuestion'

export const createContributeAssessmentGateway = () => ({
  ...createActivateAssessmentGateway(),
  ...createAddAssessedItemGateway(),
  ...createCreateAssessmentGateway(),
  ...createSetAnswersGateway(),
  ...createSetQuestionGateway()
})
