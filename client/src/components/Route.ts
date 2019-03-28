import { componentFromStream } from 'recompose'
import { from, Observable } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

export const Route = componentFromStream<{
  matchRouter: { match$: Observable<null | {}> }
  exact?: boolean
  children: any
}>((props$: any) => {
  return (from(props$) as any).pipe(
    switchMap(({ matchRouter, exact, children }) =>
      matchRouter.match$.pipe(
        map((match: any) => {
          if (match === null) {
            return null
          } else if (exact) {
            return match.exact ? children : null
          } else return children
        })
      )
    )
  )
})
