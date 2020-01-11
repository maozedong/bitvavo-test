const express = require('express');
const app = express()
app.use(express.static('./'))

app.listen(process.env.PORT || 1234)

console.log('dev-server is listening on port ' + process.env.PORT)
