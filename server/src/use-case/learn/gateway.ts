import { createAddLearningObjectiveGateway } from './AddLearningObjective'
import { createCheckAnswerGateway } from './CheckAnswer'
import { createGetNextAssessmentGateway } from './GetNextAssessment'

export const createLearnGateway = () => ({
  ...createAddLearningObjectiveGateway(),
  ...createCheckAnswerGateway(),
  ...createGetNextAssessmentGateway()
})
