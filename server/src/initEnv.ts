import path from 'path'

//////////
// ENV //
////////
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv')
  const result = dotenv.config({
    path: path.resolve(__dirname, `../env/${process.env.NODE_ENV}.env`)
  })
  if (result.error) {
    console.error('Error loading environment variables')
    console.error(result)
  }
}
