const User = require('../models/userModel')
const Folder = require('../models/folderModel')
const {TOKEN_SECRET} = require('../../config/env')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const mailer = require('../../config/mail')
const fs = require('fs')
const path = require('path')

function geraToken(params={}){
    return jwt.sign(params,TOKEN_SECRET,{expiresIn:'24h'})
}
class AuthControler{
    async register(req,res){
        const {name,email,password} = req.body
        if(await User.findOne({email:email})){
            return res.status(404).json({erro:'Este email já existe'})
        }
         
        const user = await new User({name,email,password})
        if(!user){
            return res.status(422).json({erro:'dados inválidos para cadastro'})
        }
        const mydrive = await new Folder({title:'mydrive'})
        const trash = await new Folder({title:'trash'})
        const userPath = path.resolve(__dirname,'..','..','uploads',`${user.name}-${user._id}`)
        //criar pasta do usuário
        fs.mkdir(userPath,{recursive:true},(err)=>{
            if(err){
                console.log('erro-->> '+err)
                return res.status(400).json('erro no cadastro')
            }
        })
        mydrive.path = path.join(userPath,`${mydrive.title} -- ${mydrive._id}`)
        trash.path = path.join(userPath,`${trash.title} -- ${trash._id}`)
        //cria mycloud
        fs.mkdir(mydrive.path,{recursive:true},(err)=>{
            if(err){
                console.log('erro-->> '+err)
                return res.status(400).json('erro no cadastro')
            }
        })
        //cria trash
        fs.mkdir(trash.path,{recursive:true},(err)=>{
            if(err){
                console.log('erro-->> '+err)
                return res.status(400).json('erro no cadastro')
            }
        })

        await mydrive.save()
        await trash.save()

        await user.folders.push(mydrive)
        await user.folders.push(trash)
        await user.save()
        user.password=undefined
        const token = await geraToken({id:user.id})
        return res.status(200).json({user,token})
  
    }
    async authenticate(req,res){
        const email = req.body.email
        const password = req.body.password
        const user = await User.findOne({email:email}).select('+password').populate('folders files')

        if(!user){
            return res.status(400).json({erro:"este email não está cadastrado"})
        }
        if(!await bcrypt.compare(password , user.password)){
                return res.status(401).json({erro:"senha incorreta"})
        }
        const token = await geraToken({id:user.id})
        user.password = await undefined
        return res.status(200).json({user,token})
    }
    async forgot_password(req,res){
        const email = await req.body.email
        try{
            const user = await User.findOne({email})
            if(!user){
                res.status(401).json({erro:"este email não está cadastrado"})
            }
            const tokenReq = await crypto.randomBytes(20).toString('hex')
            const now = new Date()
            now.setHours(now.getHours() + 1)
            await User.findByIdAndUpdate(user._id,{
                '$set':{
                    passwordResetToken: tokenReq,
                    passwordResetExpires:now
                }
            })
            await mailer.sendMail({
                from : "naoresponda@reqmail.com",
                to: user.email,
                subject: "Recuperação de senha",
                html:`<p>Cliqui <a href="localhost:3000/auth/reset_password?token=${tokenReq}">aqui</a> para recuperar sua senha!</p>`
            })
            
            return res.status(200).json({msg:`um email foi enviado para ${email}`})

        }catch(err){
            res.status(500).json({erro:"erro "})
        }
    }
    async recover_password(req,res){
        const token = req.query.token
        const email = req.body.email
        const password = req.body.password
        
        try{
            const user = await User.findOne({email:email}).select("+passwordResetToken passwordResetExpires")
            if(!user){
                return res.status(401).json({erro:"este email não está cadastrado"})
            }
        
            //console.log(token,user.passwordResetToken)
            if(token !== user.passwordResetToken){
                return res.status(401).json({erro:"token inválido"})
            }
            var now = await new Date()
            console.log(now,user.passwordResetExpires)
            if(now > user.passwordResetExpires){
                return res.status(408).json({erro:"tempo para recuperação de senha expirado"})
            }
            user.password = await password
            await user.save()
            return res.status(200).json({msg:"senha atualizado com sucesso"})
        }
        catch(erro){
            return res.status(500).json({erro:"erro"})
        }
    }
}
module.exports = new AuthControler()

