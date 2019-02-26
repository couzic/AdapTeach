import Router from 'koa-router'

import { Core } from '../core/Core'

export type Route = (router: Router, core: Core) => void
