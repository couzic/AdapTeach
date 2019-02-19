const neo4j = require('neo4j-driver').v1

const url = 'bolt://localhost'

const auth = {
  user: 'neo4j',
  pass: 'password'
}

const driver = neo4j.driver(url, neo4j.auth.basic(auth.user, auth.pass), {
  encrypted: false
})

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
