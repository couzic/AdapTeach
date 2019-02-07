export interface RepetitionScheduler {
  next: () => Promise<number>
}
