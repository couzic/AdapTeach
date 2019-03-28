import { Observable } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map } from 'rxjs/operators'

export interface Http {
  get: (url: string) => Observable<any>
  post: (url: string, data: object) => Observable<any>
}

