import { UseCaseDependencies } from '../../../core/Core'
import {
  Composite,
  CompositeFields,
  CompositeId
} from '../../../domain/Composite'
import { cypher } from '../../../neo4j/cypher'

export interface CreateCompositeGateway {
  createComposite: (composite: Composite) => Promise<Composite>
}

export const CreateComposite = (fields: CompositeFields) => async ({
  gateway,
  idFactory
}: UseCaseDependencies) =>
  gateway.createComposite({
    description: '',
    ...fields,
    id: idFactory.createId() as CompositeId,
    type: 'COMPOSITE',
    subObjectives: []
  })

export const createCreateCompositeGateway = (): CreateCompositeGateway => ({
  createComposite: async composite => {
    const statement = `
        CREATE (composite:Composite:Objective {id: {id}, name: {name}, description: {description}})
        RETURN composite`
    const records = await cypher.send(statement, composite)
    return records[0].get('composite').properties
  }
})
