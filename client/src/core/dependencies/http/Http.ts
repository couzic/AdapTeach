import { Observable } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map } from 'rxjs/operators'

export interface Http {
  get: (url: string) => Observable<any>
  post: (url: string, data: object) => Observable<any>
}

const postHeaders = {}

export const createHttp = (): Http => {
  return {
    get: url => ajax.getJSON(url),
    post: (url, data) =>
      ajax.post(url, data).pipe(map(result => result.response))
  }
}
