import React from 'react'
import { componentFromStream } from 'recompose'
import { filter, map } from 'rxjs/operators'

import { core } from '../../core'

export const AssessmentPage = componentFromStream(() =>
  core.home.store.pluck('nextAssessment').pipe(
    filter(nextAssessment => !!nextAssessment),
    map(nextAssessment => (
      <div>
        AssessmentPage
        {JSON.stringify(nextAssessment)}
      </div>
    ))
  )
)
