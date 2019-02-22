import Koa from 'koa'
import Router from 'koa-router'
import serveStatic from 'koa-static'
import path from 'path'

import { authRoute } from './routes/auth'
import { helloRoute } from './routes/hello'
import { userRoute } from './routes/user.'

const app = new Koa()

/////////////
// ROUTES //
///////////
const routes = [authRoute, helloRoute, userRoute]
const router = new Router()
routes.forEach(route => route(router))
app.use(router.routes())

/////////////
// STATIC //
///////////
app.use(serveStatic(path.resolve(__dirname, '../../client/build')))

////////////
// START //
//////////
const port = process.env.PORT || 3000
app.listen(port)
console.log('Server running on port ' + port)
