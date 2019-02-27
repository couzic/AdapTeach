import { History } from 'history'
import { createBrowserRouter, route } from 'observable-tree-router'

export const createRouter = (history: History) =>
  createBrowserRouter(history, {
    home: route({
      path: '/'
    }),
    auth: route({
      path: '/auth',
      nested: {
        linkedin: route({
          path: '/linkedin',
          nested: {
            callback: route({
              path: 'callback',
              params: ['code']
            })
          }
        })
      }
    })
  })
