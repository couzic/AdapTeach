import { ajax } from 'rxjs/ajax'
import { map } from 'rxjs/operators'

import { Http } from '../../core/ports/Http'

const postHeaders = {}

export const createHttp = (): Http => {
  return {
    get: url => ajax.getJSON(url),
    post: (url, data) =>
      ajax.post(url, data).pipe(map(result => result.response))
  }
}
