import { createCompositeFactory } from '../acceptance/util/CompositeFactory'
import { createItemFactory } from '../acceptance/util/ItemFactory'
import { createMcqFactory } from '../acceptance/util/McqFactory'
import { Core } from '../core/Core'
import { ActivateAssessment } from '../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedItem } from '../use-case/contribute/assessment/AddAssessedItem'
import { CreateAssessment } from '../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../use-case/contribute/assessment/SetQuestion'
import { CreateItem } from '../use-case/contribute/item/CreateItem'
import { AddLearningObjective } from '../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../use-case/learn/CheckAnswer'
import { GetNextAssessment } from '../use-case/learn/GetNextAssessment'
import { CreateUser } from '../use-case/user/CreateUser'

export const populateDb = async (core: Core) => {
  console.log('Start populating DB')

  const createItem = createItemFactory(core)
  const createComposite = createCompositeFactory(core)
  const createMcq = createMcqFactory(core)

  ///////////
  // ITEM //
  /////////
  const { id: subscribe } = await core.execute(
    CreateItem({
      name: 'Observable.subscribe() - Simple form',
      description:
        'A function passed to Observable.subscribe() will be called every time a value is emitted by that Observable'
    })
  )
  const { id: ofSingleValue } = await core.execute(
    CreateItem({
      name: 'of(singleValue)',
      description:
        'Create an Observable that emits a single value by calling of() with a single argument'
    })
  )
  const { id: ofMultipleValues } = await core.execute(
    CreateItem({
      name: 'of(multipleValues)',
      description:
        'Create an Observable that emits multiple values by calling of() with multiple arguments'
    })
  )
  const { id: ofArray } = await core.execute(
    CreateItem({
      name: 'of(array)',
      description:
        'An array is considered a regular single value when passed to of(), just as in of(singleValue) - do not confuse with from(array)'
    })
  )
  const { id: fromArray } = await core.execute(
    CreateItem({
      name: 'from(array)',
      description:
        'Each element in the array passed to from() will emit a separate event'
    })
  )
  console.log('Items populated')

  ////////////////
  // COMPOSITE //
  //////////////
  const { id: jsBasics } = await createComposite('JavaScript Basics', [])
  const { id: rxjsBasics } = await createComposite('RxJS Basics', [
    subscribe,
    ofSingleValue,
    ofMultipleValues,
    ofArray,
    fromArray
  ])

  //////////////////
  // ASSESSMENTS //
  ////////////////
  const { id: ofStringAssessment } = await core.execute(
    CreateAssessment({
      type: 'MCQ'
    })
  )
  await core.execute(AddAssessedItem(ofStringAssessment, ofSingleValue))
  await core.execute(AddAssessedItem(ofStringAssessment, subscribe))
  await core.execute(
    SetQuestion(
      ofStringAssessment,
      `\`\`\`ts
import { of } from 'rxjs'

of('value').subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
    )
  )
  await core.execute(
    SetAnswers(ofStringAssessment, [
      { text: 'value', correct: true },
      { text: 'v' },
      { text: 'Nothing will be printed' },
      { text: 'Error' }
    ])
  )
  await core.execute(ActivateAssessment(ofStringAssessment))

  const { id: ofMultipleValuesMcq } = await core.execute(
    CreateAssessment({
      type: 'MCQ'
    })
  )
  await core.execute(AddAssessedItem(ofMultipleValuesMcq, ofMultipleValues))
  await core.execute(AddAssessedItem(ofMultipleValuesMcq, subscribe))
  await core.execute(
    SetQuestion(
      ofMultipleValuesMcq,
      `\`\`\`ts
import { of } from 'rxjs'

of(10, 20).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
    )
  )
  await core.execute(
    SetAnswers(ofMultipleValuesMcq, [
      { text: '10\n20', correct: true },
      { text: '[ 10, 20 ]' },
      { text: 'Nothing will be printed' },
      { text: 'Error' }
    ])
  )
  await core.execute(ActivateAssessment(ofMultipleValuesMcq))

  const { id: ofArrayMcq } = await core.execute(
    CreateAssessment({
      type: 'MCQ'
    })
  )
  await core.execute(AddAssessedItem(ofArrayMcq, ofArray))
  await core.execute(AddAssessedItem(ofArrayMcq, ofSingleValue))
  await core.execute(AddAssessedItem(ofArrayMcq, subscribe))
  await core.execute(
    SetQuestion(
      ofArrayMcq,
      `\`\`\`ts
import { of } from 'rxjs'

of([10, 20]).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
    )
  )
  await core.execute(
    SetAnswers(ofArrayMcq, [
      { text: '10\n20' },
      { text: '[ 10, 20 ]', correct: true },
      { text: 'Nothing will be printed' },
      { text: 'Error' }
    ])
  )
  await core.execute(ActivateAssessment(ofArrayMcq))

  const { id: fromArrayMcq } = await core.execute(
    CreateAssessment({
      type: 'MCQ'
    })
  )
  await core.execute(AddAssessedItem(fromArrayMcq, fromArray))
  await core.execute(AddAssessedItem(fromArrayMcq, subscribe))
  await core.execute(
    SetQuestion(
      fromArrayMcq,
      `\`\`\`ts
import { of } from 'rxjs'

from([10, 20]).subscribe(v => console.log(v))
\`\`\`

What value will be printed in the console ?`
    )
  )
  await core.execute(
    SetAnswers(fromArrayMcq, [
      { text: '10\n20', correct: true },
      { text: '[ 10, 20 ]' },
      { text: 'Nothing will be printed' },
      { text: 'Error' }
    ])
  )
  await core.execute(ActivateAssessment(fromArrayMcq))

  console.log('DB populated')

  ///////////
  // USER //
  /////////
  const { id: userId } = await core.execute(
    CreateUser({
      username: 'couzic',
      email: 'mikaelcouzic@gmail.com'
    } as any)
  )
  await core.execute(AddLearningObjective(userId, rxjsBasics))

  const nextAssessment = await core.execute(GetNextAssessment(userId))
  console.log(nextAssessment)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 0))
}
