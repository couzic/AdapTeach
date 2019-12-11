import { JWT } from './JWT'

export class JwtStorage {
  private _jwt: JWT | null = null

  set jwt(value: JWT | null) {
    this._jwt = value
  }

  get jwt() {
    return this._jwt
  }
}
