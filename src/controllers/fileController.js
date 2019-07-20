const File = require('../models/fileModel')
const User = require('../models/userModel')
const Folder = require('../models/folderModel')
const download = require('download-file')
const fs = require('fs')
const path = require('path')

class fileController{
    async get_file(req,res){
        const id = req.params.id
        const file = await File.findById(id)
        if(!file){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        const {size} = fs.statSync(file.path)
        file.size = (size / 1024 / 1024).toFixed(2) //Mb
        return res.status(200).json(file)
    }
    async store(req,res){
        const newFile = req.newFile
        const file = await File.create(newFile)
        const folderFather = await Folder.findById(file.folderFather).populate('folders files')
        if(!folderFather){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        return res.status(200).json(folderFather) 
    }
    async update(req,res){
        const idFile= req.params.id
        const file = await File.findById(idFile)
        const title = req.body.title
        try{
            if(!file){
                return res.status(404).json({erro:"página não pôde ser encontrada"})
            }
            const folderFather = await Folder.findById(file.folderFather).populate('folders files')
            if(!folderFather){
                return res.status(404).json({erro:"página não pôde ser encontrada"})
            }
            const newPath = path.join(folderFather.path,`${file._id} -- ${title}`)
            fs.rename(file.path,newPath,(err) => {
                if (err){
                    return res.status(404).json({erro:"arquivo estático não foi atualizado!"})
                }
            })
            file.path = newPath
            file.title = title
            await file.save()
            await folderFather.save()
            return res.status(200).json(folderFather)
        }
        catch(err){
            return res.status(500).json('arquivo não pôde ser renomeado :(')
        }
         
    }
    async delete(req,res){
        const idFile= req.params.id
        const file = await File.findById(idFile)
        try{
            if(!file){
                return res.status(404).json({erro:"página não pôde ser encontrada"})
            }
            const user = await User.findById(req.userId).populate('folders files')//usuário
            const idTrash = user.folders[1]._id // id da lixeira
            const trash = await Folder.findById(idTrash).populate('files')//lixeira
            const newPath = path.join(trash.path,`${file._id} -- ${file.title}`)
            fs.rename(file.path,newPath,(err) => {
                if (err){
                    return res.status(404).json({erro:"arquivo estático não foi atualizado!"})
                }
            })
            file.path = newPath
            file.folderToRestore = file.folderFather//pasta para qual ele retornará caso seja restaurado
            file.folderFather = trash._id// o pai agora é alixeira

            //move para lixeira
            await trash.save() 
            await file.save()
            return res.status(200).json({msg:'arquivo movida para lixeira :('})
        }
        catch(erro){
            return res.status(500).json('arquivo não pôde ser deletado :(')
        }
        
    }
    async delete_permanently(req,res){
        const fileId = req.params.id
        const file = await File.findById(fileId)
        try{
            if(!file){
                return res.status(404).json({erro:"página não encontrada"})
            }
            fs.unlink(file.path,(err) => {
                if (err){
                    return res.status(404).json({erro:"arquivo estático não foi deletado!"})
                }
            });
            const fileDeleted = await File.findByIdAndDelete(fileId)
            if(!fileDeleted){
                return res.status(404).json({erro:"arquivo não pôde ser deletada"})
            }
            return res.status(200).json({msg:'arquivo deletada permanentemente :('})
        }
        catch(err){
           return res.status(500).json('arquivo não pôde ser deletado :(')
        }
    }
    async restore(req,res){
        const idFile = req.params.id
        const file = await File.findById(idFile)
        try{
            if(!file){
                return res.status(404).json({erro:"página não pôde ser encontrada"})
            }
            const user = await User.findById(req.userId).populate('files')//usuário
            const idTrash = user.folders[1]._id // id da lixeira
            const trash = await Folder.findById(idTrash).populate('files')//lixeira
            const idMycloud = user.folders[0]._id // id da pasta raiz
            const myCloud = await Folder.findById(idMycloud).populate('files')//pasta raiz
            const newPath = path.join(myCloud.path,`${file._id} -- ${file.title}`)

            fs.rename(file.path,newPath,(err) => {
                if (err){
                    return res.status(404).json({erro:"arquivo estático não foi atualizado!"})
                }
            })
            file.path = newPath
            await myCloud.save()
            await trash.save()

           
            file.folderToRestore = undefined
            await file.save()
            return res.status(200).json({msg:"arquivo restaurada com sucesso :)"})
        }

        catch(err){
            return res.status(500).json('arquivo não pôde ser restalrado :(')
        }
        
    }
}
module.exports = new fileController()