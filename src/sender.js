'use strict'

const debug = require('debug-logfmt')('queue:sender')
const { serve, send, Router } = require('micri')
const toQuery = require('to-query')()

const { PORT, API_URL } = require('./constants')
const queue = require('./queue')

const { router, on, otherwise } = Router

const isStatic = req => req.url.startsWith('/favicon.ico') || req.url.startsWith('/robots.txt')

const route = router(
  on.get(isStatic, (req, res) => send(res, 204, null)),
  otherwise(async (req, res) => {
    const query = toQuery(req.url)
    if (!query.url) return send(res, 200)

    const { priority, delay } = query
    const { id } = await queue.add(query, { priority, delay })
    
    debug(`job[${id}]`, query)

    return send(res, 201, { id, query })
  })
)

const server = serve(route)

server.listen(PORT, () => {
  debug(`Listening at http://localhost:${PORT}`)
})
