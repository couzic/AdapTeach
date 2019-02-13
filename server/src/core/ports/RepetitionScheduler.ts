export interface RepetitionScheduler {
  next: (params?: {
    passed: boolean
    history: Array<{ passed: boolean; time: number }>
  }) => Promise<number>
}
