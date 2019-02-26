import './initEnv'

import Koa from 'koa'
import Router from 'koa-router'
import serveStatic from 'koa-static'
import path from 'path'

import { createLinkedInApi } from './core/adapters/LinkedInApi'
import { createRealTimeProvider } from './core/adapters/RealTimeProvider'
import { createSimpleRepetitionScheduler } from './core/adapters/SimpleRepetitionScheduler'
import { CoreDependencies, createCore } from './core/Core'
import { createCoreGateway } from './core/CoreGateway'
import { authRoute } from './routes/auth'
import { helloRoute } from './routes/hello'
import { userRoute } from './routes/user.'

const app = new Koa()

///////////
// CORE //
/////////
const timeProvider = createRealTimeProvider()
const dependencies: CoreDependencies = {
  gateway: createCoreGateway(),
  timeProvider,
  repetitionScheduler: createSimpleRepetitionScheduler(timeProvider),
  linkedIn: createLinkedInApi()
}
const core = createCore(dependencies)

/////////////
// ROUTES //
///////////
const routes = [authRoute, helloRoute, userRoute]
const router = new Router()
routes.forEach(route => route(router, core))
app.use(router.routes())

/////////////
// STATIC //
///////////
app.use(serveStatic(path.resolve(__dirname, '../../client/build')))

////////////
// START //
//////////
const port = process.env.PORT
app.listen(port)
console.log('Server running on port ' + port)
