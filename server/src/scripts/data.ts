
// // export const categories: Category[] = [
// //   { id: 'programming' as CategoryId, name: 'Programming' },
// //   {
// //     id: 'reactive-programming' as CategoryId,
// //     name: 'Reactive Programming',
// //     parent: 'programming' as CategoryId
// //   },
// //   {
// //     id: 'rxjs' as CategoryId,
// //     name: 'RxJS',
// //     parent: 'reactive-programming' as CategoryId
// //   },
// //   {
// //     id: 'rxjs-operators' as CategoryId,
// //     name: 'RxJS Operators',
// //     parent: 'rxjs' as CategoryId
// //   }
// // ]

// const itemIds: Record<string, ItemId> = {
//   subscribeSimple: 'subscribe-simple',
//   ofSingle: 'of-single',
//   ofMulti: 'of-multi',
//   ofArray: 'of-array',
//   fromArray: 'from-array'
// } as any

// export const objectives: Objective[] = [
//   {
//     id: 'js-basics' as CompositeId,
//     type: 'COMPOSITE',
//     name: 'JavaScript Basics',
//     subObjectives: []
//   },
//   {
//     id: 'rxjs-basics' as CompositeId,
//     type: 'COMPOSITE',
//     name: 'RxJS Basics',
//     subObjectives: Object.values(itemIds)
//   }
// ]

// export const assessments: Assessment[] = [
//   {
//     type: 'MCQ-Single',
//     prerequisites: ['js-basics' as ObjectiveId],
//     assessedItems: [itemIds.ofSingle, itemIds.subscribeSimple],
//     activelyRecalledItems: [],
//     passivelyRecalledItems: [], // ES import
//     question: {
//       text: 'What value will be printed in the console ?',
//       code: [
//         {
//           language: 'ts',
//           snippet: `
//                 import { of } from 'rxjs'

//                 of('value').subscribe(v => console.log(v))            
//                 `
//         }
//       ]
//     },
//     answers: [
//       { text: 'value', correct: true },
//       { text: 'v' },
//       { text: 'Nothing will be printed' },
//       { text: 'Error' }
//     ]
//   },
//   {
//     type: 'MCQ-Single',
//     prerequisites: ['js-basics' as ObjectiveId],
//     assessedItems: [itemIds.ofMulti, itemIds.subscribeSimple],
//     activelyRecalledItems: [],
//     passivelyRecalledItems: [], // ES import
//     question: {
//       text: 'What value will be printed in the console ?',
//       code: [
//         {
//           language: 'ts',
//           snippet: `
//                 import { of } from 'rxjs'

//                 of(10, 20).subscribe(v => console.log(v))          
//                 `
//         }
//       ]
//     },
//     answers: [
//       { text: '10\n20', correct: true },
//       { text: '[ 10, 20 ]' },
//       { text: 'Nothing will be printed' },
//       { text: 'Error' }
//     ]
//   },
//   {
//     type: 'MCQ-Single',
//     prerequisites: ['js-basics' as ObjectiveId],
//     assessedItems: [itemIds.ofSingle, itemIds.ofArray, itemIds.subscribeSimple],
//     activelyRecalledItems: [],
//     passivelyRecalledItems: [], // ES import
//     question: {
//       text: 'What value will be printed in the console ?',
//       code: [
//         {
//           language: 'ts',
//           snippet: `
//                 import { of } from 'rxjs'

//                 of([10, 20]).subscribe(v => console.log(v))          
//                 `
//         }
//       ]
//     },
//     answers: [
//       { text: '10\n20' },
//       { text: '[ 10, 20 ]', correct: true },
//       { text: 'Nothing will be printed' },
//       { text: 'Error' }
//     ]
//   },
//   {
//     type: 'MCQ-Single',
//     prerequisites: ['js-basics' as ObjectiveId],
//     assessedItems: [itemIds.fromArray, itemIds.subscribeSimple],
//     activelyRecalledItems: [],
//     passivelyRecalledItems: [], // ES import
//     question: {
//       text: 'What value will be printed in the console ?',
//       code: [
//         {
//           language: 'ts',
//           snippet: `
//                 import { from } from 'rxjs'

//                 from(10, 20).subscribe(v => console.log(v))          
//                 `
//         }
//       ]
//     },
//     answers: [
//       { text: '10\n20', correct: true },
//       { text: '[ 10, 20 ]' },
//       { text: 'Nothing will be printed' },
//       { text: 'Error' }
//     ]
//   }
// ]
