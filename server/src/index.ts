import Koa from 'koa'
import Router from 'koa-router'
import serveStatic from 'koa-static'
import path from 'path'

const app = new Koa()

const router = new Router()

router.get('/hello', async ctx => {
  ctx.status = 200
  ctx.body = 'OK'
})

app.use(router.routes())

app.use(serveStatic(path.resolve(__dirname, '../../client/build')))

const port = process.env.PORT || 3000
app.listen(port)
console.log('Server running on port ' + port)
