const User = require('../models/userModel')
const Folder = require('../models/folderModel')
const File = require('../models/fileModel')
const fs = require('fs')
const path = require('path')
const find = require('find')


class PermitionMiddleware{

	async read(req,res,next){
		console.log('entrou no midlleware de permição');
		const id = req.params.id
        const user = await User.findById(req.userId)
        //console.log(Object.getOwnPropertyNames(user.foldersPermition))
        const foldersPermition = []
        user.foldersPermition.forEach(f =>{
            foldersPermition.push(f.toString('hex'))
        });
        if(foldersPermition.indexOf(id)===-1){
            return res.status(421).json({erro:'erro'})
        }
		next()
	}
}
module.exports = new PermitionMiddleware