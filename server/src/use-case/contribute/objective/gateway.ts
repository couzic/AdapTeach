import { createAddToObjectiveGateway } from './AddToObjective'
import { createCreateLearningObjectiveGateway } from './CreateLearningObjective'
import { createFindCompositeObjectiveByIdGateway } from './FindCompositeObjectiveById'
import { createSearchCompositeObjectiveGateway } from './SearchCompositeObjective'

export const createContributeLearningObjectiveGateway = () => ({
  ...createAddToObjectiveGateway(),
  ...createCreateLearningObjectiveGateway(),
  ...createFindCompositeObjectiveByIdGateway(),
  ...createSearchCompositeObjectiveGateway()
})
