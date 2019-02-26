import { createKcFactory } from '../acceptance/util/KcFactory'
import { createMcqFactory } from '../acceptance/util/McqFactory'
import { createObjectiveFactory } from '../acceptance/util/ObjectiveFactory'
import { Core } from '../core/Core'
import { ActivateAssessment } from '../use-case/contribute/assessment/ActivateAssessment'
import { AddAssessedComponent } from '../use-case/contribute/assessment/AddAssessedComponent'
import { CreateAssessment } from '../use-case/contribute/assessment/CreateAssessment'
import { SetAnswers } from '../use-case/contribute/assessment/SetAnswers'
import { SetQuestion } from '../use-case/contribute/assessment/SetQuestion'
import { CreateKnowledgeComponent } from '../use-case/contribute/component/CreateKnowledgeComponent'
import { AddLearningObjective } from '../use-case/learn/AddLearningObjective'
import { CheckAnswer } from '../use-case/learn/CheckAnswer'
import { FindNextAssessment } from '../use-case/learn/FindNextAssessment'
import { CreateUser } from '../use-case/user/CreateUser'

export const populateDb = async (core: Core) => {
  console.log('Start populating DB')

  const createItem = createKcFactory(core)
  const createComposite = createObjectiveFactory(core)
  const createMcq = createMcqFactory(core)

  ///////////
  // ITEM //
  /////////
  const { id: subscribe } = await core.execute(
    CreateKnowledgeComponent({
      name: 'Observable.subscribe() - Simple form',
      description:
        'A function passed to Observable.subscribe() will be called every time a value is emitted by that Observable'
    })
  )
  const { id: ofSingleValue } = await core.execute(
    CreateKnowledgeComponent({
      name: 'of(singleValue)',
      description:
        'Create an Observable that emits a single value by calling of() with a single argument'
    })
  )
  const { id: ofMultipleValues } = await core.execute(
    CreateKnowledgeComponent({
      name: 'of(multipleValues)',
      description:
        'Create an Observable that emits multiple values by calling of() with multiple arguments'
    })
  )
  const { id: ofArray } = await core.execute(
    CreateKnowledgeComponent({
      name: 'of(array)',
      description:
        'An array is considered a regular single value when passed to of(), just as in of(singleValue) - do not confuse with from(array)'
    })
  )
  const { id: fromArray } = await core.execute(
    CreateKnowledgeComponent({
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
  await core.execute(AddAssessedComponent(ofStringAssessment, ofSingleValue))
  await core.execute(AddAssessedComponent(ofStringAssessment, subscribe))
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
  await core.execute(
    AddAssessedComponent(ofMultipleValuesMcq, ofMultipleValues)
  )
  await core.execute(AddAssessedComponent(ofMultipleValuesMcq, subscribe))
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
  await core.execute(AddAssessedComponent(ofArrayMcq, ofArray))
  await core.execute(AddAssessedComponent(ofArrayMcq, ofSingleValue))
  await core.execute(AddAssessedComponent(ofArrayMcq, subscribe))
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
  await core.execute(AddAssessedComponent(fromArrayMcq, fromArray))
  await core.execute(AddAssessedComponent(fromArrayMcq, subscribe))
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

  console.log('Start learning')

  let nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment!.question)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 0))
  nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment!.question)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 0))
  nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment!.question)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 0))
  nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment!.question)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 0))
  nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment && nextAssessment.question)
  await core.execute(CheckAnswer(userId, nextAssessment!.id, 1))
  nextAssessment = await core.execute(FindNextAssessment(userId))
  console.log(nextAssessment && nextAssessment.question)
}
