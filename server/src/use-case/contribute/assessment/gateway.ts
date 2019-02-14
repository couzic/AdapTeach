import { createActivateAssessmentGateway } from './ActivateAssessment'
import { createAddAssessedComponentGateway } from './AddAssessedComponent'
import { createAddPrerequisiteGateway } from './AddPrerequisite'
import { createCreateAssessmentGateway } from './CreateAssessment'
import { createSetAnswersGateway } from './SetAnswers'
import { createSetQuestionGateway } from './SetQuestion'

export const createContributeAssessmentGateway = () => ({
  ...createActivateAssessmentGateway(),
  ...createAddAssessedComponentGateway(),
  ...createAddPrerequisiteGateway(),
  ...createCreateAssessmentGateway(),
  ...createSetAnswersGateway(),
  ...createSetQuestionGateway()
})
