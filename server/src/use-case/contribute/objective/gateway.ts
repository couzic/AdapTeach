import { createCreateLearningObjectiveGateway } from './CreateLearningObjective'
import { createAddToObjectiveGateway } from './AddToObjective'

export const createContributeLearningObjectiveGateway = () => ({
  ...createAddToObjectiveGateway(),
  ...createCreateLearningObjectiveGateway()
})
