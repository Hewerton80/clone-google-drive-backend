const fs = require('fs')
const path = require('path')

module.exports = (app)=>{
    //lista os arquivos do diretório routes
    let listRoutes = fs.readdirSync(__dirname)
    //console.log(listRoutes)
    //remove da lista o arquivo com o nome index.js
    listRoutes = listRoutes.filter( file =>{
        return file !== "index.js"
    })
    //console.log(listRoutes)
    listRoutes.forEach( file => {
        let route = path.resolve(__dirname,file)
        //console.log(route)
        require(route)(app)
    })
}