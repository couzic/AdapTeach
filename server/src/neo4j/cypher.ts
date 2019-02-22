const neo4j = require('neo4j-driver').v1

const url = 'bolt://localhost'

let driver: any

if (process.env.NODE_ENV === 'production') {
  const graphenedbURL = process.env.GRAPHENEDB_BOLT_URL
  const graphenedbUser = process.env.GRAPHENEDB_BOLT_USER
  const graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD
  driver = neo4j.driver(
    graphenedbURL,
    neo4j.auth.basic(graphenedbUser, graphenedbPass)
  )
} else {
  const auth = {
    user: 'neo4j',
    pass: 'password'
  }
  driver = neo4j.driver(url, neo4j.auth.basic(auth.user, auth.pass), {
    encrypted: false
  })
}

const send = (statement, parameters) => {
  const session = driver.session()
  return session
    .run(statement, parameters)
    .then(function(result) {
      session.close()
      return result.records
    })
    .catch(error => {
      console.error('Cypher Error', error)
      session.close()
    })
}

const session = () => driver.session()

const clearDb = async () => {
  await cypher.send('MATCH ()-[r]-() DELETE r', {})
  await cypher.send('MATCH (n) DELETE n ', {})
}

export const cypher = { send, session, clearDb }
