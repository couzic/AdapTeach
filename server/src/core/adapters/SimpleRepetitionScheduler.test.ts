import { expect } from 'chai'
import { asSequence } from 'sequency'

import { AssessmentId } from '../../domain/Assessment'
import { AssessmentHistory } from '../../domain/AssessmentHistory'
import { KnowledgeComponentId } from '../../domain/KnowledgeComponent'
import { RepetitionScheduler, Schedule } from '../ports/RepetitionScheduler'
import { createSimpleRepetitionScheduler } from './SimpleRepetitionScheduler'

class SchedulerTestFacade {
  private readonly scheduler: RepetitionScheduler
  private readonly componentsByAssessment: Record<
    AssessmentId,
    KnowledgeComponentId[]
  > = {} as any
  private readonly repetitionByComponent: Partial<
    Record<KnowledgeComponentId, { delay: number; time: number }>
  > = {}
  private readonly assessmentsByComponent: Record<
    KnowledgeComponentId,
    AssessmentId[]
  > = {} as any
  private readonly historyByAssessment: Record<
    AssessmentId,
    AssessmentHistory
  > = {} as any

  private _now = 365 * 24 * 60 * 60 * 1000 // January 1st, 1971 (approximately)
  constructor() {
    const timeProvider = {
      now: () => this._now
    }
    this.scheduler = createSimpleRepetitionScheduler(timeProvider)
  }
  get now() {
    return this._now
  }
  set now(time: number) {
    if (time <= this._now) throw Error('Can NOT go back in time')
    this._now = time
  }
  moveForward(time: number) {
    this._now += time
  }
  registerAssessment(
    assessmentId: AssessmentId,
    components: KnowledgeComponentId[]
  ) {
    this.componentsByAssessment[assessmentId] = components
    components.forEach(id => {
      const assessments = this.assessmentsByComponent[id] || []
      assessments.push(assessmentId)
      this.assessmentsByComponent[id] = assessments
    })
  }
  async next(params: {
    passed: boolean
    assessmentId: AssessmentId
  }): Promise<Schedule> {
    const { passed, assessmentId } = params
    const components = this.componentsByAssessment[assessmentId].map(id => ({
      id,
      repetition: this.repetitionByComponent[id]
    }))
    const assessments = asSequence(components)
      .map(_ => _.id)
      .map(kcId => this.assessmentsByComponent[kcId])
      .flatten()
      .map(id => ({
        id,
        assessedComponents: this.componentsByAssessment[id],
        history: this.historyByAssessment[id] || []
      }))
      .toArray()
    const history = this.historyByAssessment[assessmentId] || []
    history.push({ passed, time: this._now })
    this.historyByAssessment[assessmentId] = history
    const schedule = await this.scheduler.next({
      passed,
      assessmentId,
      components,
      assessments
    })
    components
      .map(_ => _.id)
      .forEach(kcId => {
        const time = schedule[kcId]
        const delay = time - this._now
        this.repetitionByComponent[kcId] = { delay, time }
      })
    return schedule
  }
}

describe('SimpleRepetitionScheduler', () => {
  let scheduler: SchedulerTestFacade
  let schedule: Schedule
  beforeEach(() => {
    scheduler = new SchedulerTestFacade()
  })
  describe('for single newly assessed kc', () => {
    const kcId: KnowledgeComponentId = 'KnowledgeComponentId'
    const assessmentId: AssessmentId = 'McqId'
    beforeEach(() => {
      scheduler.registerAssessment(assessmentId, [kcId])
    })
    describe('when passed', () => {
      let firstDelay: number
      beforeEach(async () => {
        schedule = await scheduler.next({ passed: true, assessmentId })
        firstDelay = schedule[kcId] - scheduler.now
      })
      it('schedules repetition in the future', () => {
        expect(schedule[kcId]).to.be.greaterThan(scheduler.now)
      })
      describe(`when it's time to repeat`, () => {
        beforeEach(() => {
          scheduler.now = schedule[kcId]
        })
        describe('when passed again', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: true,
              assessmentId
            })
          })
          it('schedules repetition with doubled delay', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + firstDelay * 2)
          })
        })
        describe('when fails', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: false,
              assessmentId
            })
          })
          it('schedules repetition with half delay', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + firstDelay / 2)
          })
        })
      })
      describe(`when half delay is passed`, () => {
        let delay: number
        beforeEach(() => {
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay / 2)
        })
        describe('when passed again', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: true,
              assessmentId
            })
          })
          it('schedules repetition with delay = (previous delay + time elapsed since last validation)', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + delay * 1.5)
          })
        })
      })
      describe(`when double delay is passed`, () => {
        let delay: number
        beforeEach(() => {
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay * 2)
        })
        describe('when fails', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: false,
              assessmentId
            })
          })
          it('schedules repetition with same delay as last success', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + delay)
          })
        })
      })
      describe(`when delay over-passed by half`, () => {
        let delay: number
        beforeEach(() => {
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay * 1.5)
        })
        describe('when fails', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: false,
              assessmentId
            })
          })
          it('schedules repetition with delay = actualDelay / 2', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + delay * 0.75)
          })
        })
      })
      describe(`when delay passed several times`, () => {
        let delay: number
        beforeEach(() => {
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay * 3)
        })
        describe('when fails', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: false,
              assessmentId
            })
          })
          it('schedules repetition with same delay as last success', () => {
            expect(schedule[kcId]).to.equal(scheduler.now + delay)
          })
        })
      })
    })
    describe(`when [FAIL | SUCCESS | FAIL | SUCCESS] and it's time to repeat for each`, () => {
      let delay: number
      let delayAfterFirstSuccess: number
      beforeEach(async () => {
        const scheduleResult = async (passed: boolean) => {
          schedule = await scheduler.next({
            passed,
            assessmentId
          })
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay)
        }
        await scheduleResult(false)
        await scheduleResult(true)
        delayAfterFirstSuccess = delay
        await scheduleResult(false)
        await scheduleResult(true)
      })
      it(`schedules repetition with shorter delay than after first success`, () => {
        expect(delay).to.be.lessThan(delayAfterFirstSuccess)
      })
    })
    describe(`when [FAIL | FAIL | QUICK SUCCESS]`, () => {
      let delay: number
      let delayAfterSecondFailure: number
      beforeEach(async () => {
        const scheduleResult = async (
          passed: boolean,
          moveForward?: number
        ) => {
          schedule = await scheduler.next({
            passed,
            assessmentId
          })
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(moveForward ? moveForward : delay)
        }
        await scheduleResult(false)
        await scheduleResult(false, 60 * 1000) // Move 1 minute forward
        delayAfterSecondFailure = delay
        await scheduleResult(true)
      })
      it(`schedules repetition with longer delay than after last failure`, () => {
        expect(delay).to.be.greaterThan(delayAfterSecondFailure)
      })
    })

    describe(`when [FAIL | FAIL | FAIL | FAIL | FAIL | SUCCESS] and it's time to repeat for each`, () => {
      let delay: number
      beforeEach(async () => {
        const scheduleResult = async (passed: boolean) => {
          schedule = await scheduler.next({
            passed,
            assessmentId
          })
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay)
        }
        await scheduleResult(false)
        await scheduleResult(false)
        await scheduleResult(false)
        await scheduleResult(false)
        await scheduleResult(false)
        await scheduleResult(true)
      })
      it(`schedules repetition in the future`, () => {
        expect(delay).to.be.greaterThan(0)
      })
    })

    describe(`when [FAIL | FAIL | SUCCESS | SUCCESS | SUCCESS | SUCCESS] and it's time to repeat for each`, () => {
      let delay: number
      let previousDelay: number
      beforeEach(async () => {
        const scheduleResult = async (passed: boolean) => {
          schedule = await scheduler.next({
            passed,
            assessmentId
          })
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay)
        }
        await scheduleResult(false)
        await scheduleResult(false)
        await scheduleResult(true)
        await scheduleResult(true)
        await scheduleResult(true)
        previousDelay = delay
        await scheduleResult(true)
      })
      it(`ignores failures`, () => {
        expect(delay).to.equal(previousDelay * 2)
      })
    })

    describe(`when [SUCCESS | SUCCESS | SUCCESS | FAIL | FAIL | SUCCESS] and it's time to repeat for each`, () => {
      let delay: number
      let delayAfterLastFailure: number
      beforeEach(async () => {
        const scheduleResult = async (passed: boolean) => {
          schedule = await scheduler.next({
            passed,
            assessmentId
          })
          delay = schedule[kcId] - scheduler.now
          scheduler.moveForward(delay)
        }
        await scheduleResult(true)
        await scheduleResult(true)
        await scheduleResult(true)
        await scheduleResult(false)
        await scheduleResult(false)
        delayAfterLastFailure = delay
        await scheduleResult(true)
      })
      it(`has shorter delay than it would if it hadn't failed before`, () => {
        expect(delay).to.be.lessThan(delayAfterLastFailure * 2)
      })
    })
  })

  describe(`
    (KC-1) <-- (Assessment-1)
           <-- (Assessment-BOTH) --> (KC-2)
  `, () => {
    const firstKcId = 'KC-1' as KnowledgeComponentId
    const secondKcId = 'KC-2' as KnowledgeComponentId
    const firstKcAssessmentId = 'Assessment-1' as AssessmentId
    const bothKcAssessmentId = 'Assessment-BOTH' as AssessmentId
    beforeEach(() => {
      scheduler.registerAssessment(firstKcAssessmentId, [firstKcId])
      scheduler.registerAssessment(bothKcAssessmentId, [firstKcId, secondKcId])
    })
    describe('when passed first assessment', () => {
      beforeEach(async () => {
        schedule = await scheduler.next({
          passed: true,
          assessmentId: firstKcAssessmentId
        })
      })
      it('schedules repetition in the future', () => {
        expect(schedule[firstKcId]).to.be.greaterThan(scheduler.now)
      })
      describe(`when it's time to repeat`, () => {
        beforeEach(() => {
          scheduler.now = schedule[firstKcId]
        })
        describe('when passed assessment targeting both KCs', () => {
          beforeEach(async () => {
            schedule = await scheduler.next({
              passed: true,
              assessmentId: bothKcAssessmentId
            })
          })
          it('schedules repetition in the future for both KCs', () => {
            expect(schedule[firstKcId]).to.be.greaterThan(scheduler.now)
            expect(schedule[secondKcId]).to.be.greaterThan(scheduler.now)
          })
        })
      })
    })
  })
})
