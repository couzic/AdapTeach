import { createActivateAssessmentGateway } from './ActivateAssessment'
import { createAddAssessedItemGateway } from './AddAssessedItem'
import { createAddPrerequisiteGateway } from './AddPrerequisite'
import { createCreateAssessmentGateway } from './CreateAssessment'
import { createSetAnswersGateway } from './SetAnswers'
import { createSetQuestionGateway } from './SetQuestion'

export const createContributeAssessmentGateway = () => ({
  ...createActivateAssessmentGateway(),
  ...createAddAssessedItemGateway(),
  ...createAddPrerequisiteGateway(),
  ...createCreateAssessmentGateway(),
  ...createSetAnswersGateway(),
  ...createSetQuestionGateway()
})
