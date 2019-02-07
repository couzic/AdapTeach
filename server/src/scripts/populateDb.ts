import { createProductionCore } from '../adapters/production/createProductionCore'

export const populateDb = async () => {
  console.log('Start populating DB')

  const core = createProductionCore()

  ///////////
  // ITEM //
  /////////
  const { id: subscribe } = await core.item.createItem({
    name: 'Observable.subscribe() - Simple form',
    description:
      'A function passed to Observable.subscribe() will be called every time a value is emitted by that Observable'
  })
  const { id: ofSingleValue } = await core.item.createItem({
    name: 'of(singleValue)',
    description:
      'Create an Observable that emits a single value by calling of() with a single argument'
  })
  const { id: ofMultipleValues } = await core.item.createItem({
    name: 'of(multipleValues)',
    description:
      'Create an Observable that emits multiple values by calling of() with multiple arguments'
  })
  const { id: ofArray } = await core.item.createItem({
    name: 'of(array)',
    description:
      'An array is considered a regular single value when passed to of(), just as in of(singleValue) - do not confuse with from(array)'
  })
  const { id: fromArray } = await core.item.createItem({
    name: 'from(array)',
    description:
      'Each element in the array passed to from() will emit a separate event'
  })
  console.log('Items populated')

  ////////////////
  // COMPOSITE //
  //////////////
  const { id: jsBasics } = await core.composite.createComposite({
    name: 'JavaScript Basics'
  })
  const { id: rxjsBasics } = await core.composite.createComposite({
    name: 'RxJS Basics'
  })
  const rxItems = [
    subscribe,
    ofSingleValue,
    ofMultipleValues,
    ofArray,
    fromArray
  ]
  await Promise.all(
    rxItems.map(id => core.composite.addSubObjective(rxjsBasics, id))
  )

  //////////////////
  // ASSESSMENTS //
  ////////////////
  const { id: ofStringAssessment } = await core.assessment.createAssessment({
    type: 'MCQ'
  })
  await core.assessment.addAssessedItem(ofStringAssessment, ofSingleValue)
  await core.assessment.addAssessedItem(ofStringAssessment, subscribe)
  await core.assessment.setQuestion(
    ofStringAssessment,
    `\`\`\`ts
import { of } from 'rxjs'

of('value').subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
  )
  await core.assessment.setAnswers(ofStringAssessment, [
    { text: 'value', correct: true },
    { text: 'v' },
    { text: 'Nothing will be printed' },
    { text: 'Error' }
  ])

  const { id: ofMultipleValuesMcq } = await core.assessment.createAssessment({
    type: 'MCQ'
  })
  await core.assessment.addAssessedItem(ofMultipleValuesMcq, ofMultipleValues)
  await core.assessment.addAssessedItem(ofMultipleValuesMcq, subscribe)
  await core.assessment.setQuestion(
    ofMultipleValuesMcq,
    `\`\`\`ts
import { of } from 'rxjs'

of(10, 20).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
  )
  await core.assessment.setAnswers(ofMultipleValuesMcq, [
    { text: '10\n20', correct: true },
    { text: '[ 10, 20 ]' },
    { text: 'Nothing will be printed' },
    { text: 'Error' }
  ])

  const { id: ofArrayMcq } = await core.assessment.createAssessment({
    type: 'MCQ'
  })
  await core.assessment.addAssessedItem(ofArrayMcq, ofArray)
  await core.assessment.addAssessedItem(ofArrayMcq, ofSingleValue)
  await core.assessment.addAssessedItem(ofArrayMcq, subscribe)
  await core.assessment.setQuestion(
    ofArrayMcq,
    `\`\`\`ts
import { of } from 'rxjs'

of([10, 20]).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
  )
  await core.assessment.setAnswers(ofArrayMcq, [
    { text: '10\n20' },
    { text: '[ 10, 20 ]', correct: true },
    { text: 'Nothing will be printed' },
    { text: 'Error' }
  ])

  const { id: fromArrayMcq } = await core.assessment.createAssessment({
    type: 'MCQ'
  })
  await core.assessment.addAssessedItem(fromArrayMcq, fromArray)
  await core.assessment.addAssessedItem(fromArrayMcq, subscribe)
  await core.assessment.setQuestion(
    fromArrayMcq,
    `\`\`\`ts
import { of } from 'rxjs'

from([10, 20]).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
  )
  await core.assessment.setAnswers(fromArrayMcq, [
    { text: '10\n20', correct: true },
    { text: '[ 10, 20 ]' },
    { text: 'Nothing will be printed' },
    { text: 'Error' }
  ])

  console.log('DB populated')

  console.log('Start learning')

  ///////////
  // USER //
  /////////
  const { id: userId } = await core.user.createUser({
    username: 'couzic',
    email: 'mikaelcouzic@gmail.com'
  })
  await core.user.addLearningObjective(userId, rxjsBasics)

  const nextAssessment = await core.user.nextAssessment(userId)
  console.log(nextAssessment)
}
