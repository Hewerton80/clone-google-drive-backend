const config = require('../../config/env')
const jwt = require('jsonwebtoken')

module.exports = (req,res,next) =>{
    const authHeader = req.headers.authorization
    if(!authHeader){
        res.status(401).json({erro:"token não informado"})
    }
    const parts = authHeader.split(' ')
    if(parts.length !== 2){
        return res.status(401).json("token mal formatado")
    }
    const [bearer,token]=parts
    if(bearer !== "Bearer"){
        return res.status(401).json("token mal formatado")
    }
    jwt.verify(token,config.TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).json({erro:"token inválido"})
        }
        req.userId = decoded.id
        next()
    })


}