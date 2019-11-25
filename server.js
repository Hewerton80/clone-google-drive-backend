const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path') 
const {PORT} = require('./config/env')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(cors())

//Middlewares globais
app.use(require('./src/sockets')(io))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
/*basicamente está sendo feito um redirecionamento.
Toda vez que o usuário acessar a rota files, será buscado
os arquivos físicos que contem dentro da pasta uploads
*/
app.use('/files',express.static(path.resolve(__dirname,'uploads')))

//load routes
require('./routes')(app)

server.listen(PORT,()=>{
    console.log(`Ativo em ${PORT}`)
})