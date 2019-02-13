import { expect } from 'chai'

import { RepetitionScheduler } from '../ports/RepetitionScheduler'
import { TimeProvider } from '../ports/TimeProvider'
import { createSimpleRepetitionScheduler } from './SimpleRepetitionScheduler'

describe('SimpleRepetitionScheduler', () => {
  let timeProvider: TimeProvider
  let now: number = 0
  let scheduler: RepetitionScheduler
  beforeEach(() => {
    timeProvider = { now: () => now }
    scheduler = createSimpleRepetitionScheduler(timeProvider)
  })
  describe('when passed', () => {
    let next: number
    beforeEach(async () => {
      next = await scheduler.next({
        passed: true,
        history: []
      })
    })
    it('schedules repetition in the future', async () => {
      const next = await scheduler.next()
      expect(next).to.be.greaterThan(now)
    })
  })
  describe('when passed twice', () => {
    let next: number
    beforeEach(async () => {
      now = 10
      next = await scheduler.next({
        passed: true,
        history: [{ passed: true, time: 0 }]
      })
    })
    it('shedules with longer delay than last', () => {
      expect(next).to.be.greaterThan(20)
    })
  })
  describe('when passed then failed', () => {
    let next: number
    beforeEach(async () => {
      now = 10
      next = await scheduler.next({
        passed: false,
        history: [{ passed: true, time: 0 }]
      })
    })
    it('shedules with shorter delay than last', () => {
      expect(next).to.be.lessThan(20)
    })
  })
  describe('when passed, then failed twice', () => {
    let next: number
    beforeEach(async () => {
      now = 15
      next = await scheduler.next({
        passed: false,
        history: [{ passed: true, time: 0 }, { passed: true, time: 10 }]
      })
    })
    it('shedules with longer delay than last', () => {
      expect(next).to.be.lessThan(20)
    })
  })
})
