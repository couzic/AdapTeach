import './initEnv'

import { readFileSync } from 'fs'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import jwt from 'koa-jwt'
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
import { kcRoute } from './routes/kc'
import { objectiveRoute } from './routes/objective'
import { userRoute } from './routes/user.'

const app = new Koa()

//////////
// LOG //
////////
if (process.env.NODE_ENV !== 'production') {
  app.use(async (ctx, next) => {
    const received = new Date().getTime()
    await next()
    const duration: number = new Date().getTime() - received
    console.log(
      ctx.request.method +
        ' - ' +
        ctx.response.status +
        ' - ' +
        ctx.request.url +
        ' (' +
        duration +
        'ms)'
    )
  })
}

/////////////
// ERRORS //
///////////
// DEV CATCH ALL
if (process.env.NODE_ENV !== 'production') {
  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      console.error(
        'ERROR - ' +
          ctx.request.method +
          ' - ' +
          ctx.response.status +
          ' - ' +
          ctx.request.url
      )
      // console.error(error)
      ctx.throw(500, 'Internal Server Error')
    }
  })
}
// Handle Boom errors
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    if (e.isBoom) {
      ctx.response.status = e.output.statusCode
      ctx.body = e.output.payload
    } else {
      throw e
    }
  }
})

/////////////////
// PARSE JSON //
///////////////
app.use(
  bodyParser({
    onerror: function(err, ctx) {
      ctx.throw(422, 'body parse error')
    }
  })
)

//////////
// JWT //
////////
const secret = process.env.JWT_SECRET!
app.use(jwt({ secret, passthrough: true }))

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
const routes = [authRoute, kcRoute, objectiveRoute, helloRoute, userRoute]
const router = new Router()
routes.forEach(route => route(router, core))
app.use(router.routes())

/////////////
// STATIC //
///////////
if (process.env.NODE_ENV !== 'development') {
  app.use(serveStatic(path.resolve(__dirname, '../../client/build')))
  // Default to index.html
  const indexHtml = readFileSync(
    path.resolve(__dirname, '../../client/build/index.html')
  )
  app.use(async ctx => {
    ctx.set('Content-Type', 'text/html')
    ctx.body = indexHtml
  })
}

////////////
// START //
//////////
const port = process.env.PORT
app.listen(port)
console.log('Server running on port ' + port)
