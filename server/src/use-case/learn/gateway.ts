import { createAddLearningObjectiveGateway } from './AddLearningObjective'
import { createCheckAnswerGateway } from './CheckAnswer'
import { createFindNextAssessmentGateway } from './FindNextAssessment'

export const createLearnGateway = () => ({
  ...createAddLearningObjectiveGateway(),
  ...createCheckAnswerGateway(),
  ...createFindNextAssessmentGateway()
})
