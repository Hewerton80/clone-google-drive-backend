const User = require('../models/userModel')
const Folder = require('../models/folderModel')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const find = require('find')
const zip = require('zip-a-folder')
const {URL,PORT} = require('../../config/env')

class FolderController{
    async show(req,res){
        const folderId = req.params.id
        const folder = await Folder.findById(folderId).populate('folders files')
        if(!folder){
            return res.status(404).json({erro:"diretorio não encontrado"})
        }
        return res.status(200).json(folder)
    }
    async store(req,res){
        let title = req.body.title.trim()
        const folderId = req.params.id
        const folderFather = await Folder.findById(folderId).populate('folders files')
        if(!folderFather){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        const newFolderChild = await new Folder({
            title        : title,
            folderFather : folderFather._id
        })
        const pathNewFolderChild = path.join(folderFather.path,`${title} -- ${newFolderChild._id}`)
       
        fs.mkdir(pathNewFolderChild,{recursive:true},(err)=>{
            if(err){ 
                return res.status(400).json({erro:"pasta não pôde ser criada"})
            }
        })
        newFolderChild.path = await pathNewFolderChild
        await folderFather.save()// adiciona o newFolderchild ao folderFather
        await newFolderChild.save()
        //req.io.sockets.emit(folderId).emit('folder',newFolderChild)
        // folderID é o id da sala
        return res.status(200).json(folderFather) 
        
    }
    async upadate(req,res){
        let title = req.body.title.trim()
        const idfolder = req.params.id
        const folder = await Folder.findById(idfolder).populate('folders files')
        if(!folder){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        const folderFather = await Folder.findById(folder.folderFather)
        const newPath = path.join(folderFather.path,`${title} -- ${folder._id}`)
        await fs.renameSync(folder.path,newPath)

        if (fs.existsSync(newPath)) {
            console.log('daria certo');
        }

        //autualizando o path dos diretórios filhos
        const newPathDirs =  await find.dirSync(newPath)
        //console.log(newPathDirs);
        newPathDirs.forEach(async dir=>{
            console.log('\n'+dir+'\n')
            let idPath = dir.split(path.sep)
            idPath = idPath[idPath.length-1]
            let [,idFodler] = idPath.split(' -- ')
            let f = await Folder.findById(idFodler)
            console.log(f.title);
            if(f){
                
                f.path = dir
                await f.save()
            }
            
        })
        //------

        folder.title = title
        folder.path = newPath
        await folder.save()

        //newPathDirs.forEach(dir=>{console.log('\n'+dir+'\n')})
        //const newPathFiles = find.dirSync(newPathDirs)



        return res.status(200).json(folderFather)
    }
    async delete(req,res){
        const idfolderChild = req.params.id

        const folderChild = await Folder.findById(idfolderChild).populate('folders')
        if(!folderChild){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        const folderFather = folderChild.folderFather
        const user = await User.findById(req.userId).populate('folders')//usuário
        const idTrash = user.folders[1]._id // id da lixeira
        const trash = await Folder.findById(idTrash).populate('folders')//lixeira 
        const newPath = await path.join(trash.path,`${folderChild.title} -- ${folderChild._id}`)
        fse.move(folderChild.path, newPath ,(err)=>{
            if(err){
                console.log('erro :)--.>>'+err);
                return res.status(400).json({erro:'pasta não pôde ser deletada'})
            }
        })


       
       // console.log('\n'+newPath+'\n');
        folderChild.path = newPath
        folderChild.folderToRestore = await folderChild.folderFather._id//pasta para qual ele retornará caso seja restaurado
        folderChild.folderFather = await trash._id// o pai agora é alixeira
        await trash.save() 
        await folderChild.save()
        return res.status(200).json(folderFather)
    }
    async delete_permanently(req,res){
        const idfodler = req.params.id
        const folder = await Folder.findById(idfodler)
        if(!folder){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        //console.log('path:'+folder.path)
        fs.rmdir(folder.path,(err)=>{
            if(err){
                console.log(err);
                return res.status(400).json({erro:'pasta não pôde ser deletada permanentemente'})
            }    
        })
        const folderDeleted = await Folder.findByIdAndDelete(idfodler)
        if(!folderDeleted){
            return res.status(404).json({erro:"pasta não pôde ser deletada :("})
        }
        return res.status(200).json({msg:'pasta deletada permanentemente :(' })
    }
    async restore(req,res){
        const idfolderChild = req.params.id
        const folderChild = await Folder.findById(idfolderChild).populate('folders')
        
        if(!folderChild){
            return res.status(404).json({erro:"página não pôde ser encontrada"})
        }
        const user = await User.findById(req.userId).populate('folders')//usuário
        const idMycloud = user.folders[0]._id // id da lixeira
        const myCloud = await Folder.findById(idMycloud).populate('folders')//lixeira
        const idTrash = user.folders[1]._id // id da lixeira
        const trash = await Folder.findById(idTrash).populate('folders')//lixeira
    
        const newPath = path.join(myCloud.path,`${folderChild.title} -- ${folderChild._id}`)
        folderChild.folderFather = myCloud._i
        fse.move(folderChild.path, newPath ,(err)=>{
            if(err){
                console.log(err);
                return res.status(400).json({erro:'pasta não pôde ser restaurada'})
            }
        })
        folderChild.path = newPath
        folderChild.folderToRestore =  undefined
        folderChild.folderFather = myCloud._id
        await myCloud.save()
        await trash.save()
        await folderChild.save()
        return res.status(200).json({msg:"pasta restaurada com sucesso :)"})

    }
    async teste(req,res){
        /*const files = find.fileSync(path.resolve(__dirname,'..','..','uploads'))
            .filter(file=>path.basename(file)!=='.gitkeep')

        const dirs = find.dirSync(path.resolve(__dirname,'..','..','uploads'))
        return res.status(200).json({files,dirs})*/
        const oldPath = path.resolve(__dirname,'..','..','uploads','teste')
        const newPath = path.resolve(__dirname,'..','..','uploads','newteste')
        await fs.rename(oldPath,newPath,(err)=>{
            if(err){
                console.log(':(--->'+err)
            }
        })
        return res.send('deu certo')
    }
    async zip(req,res){
        const id = req.params.id
        const folder = await Folder.findById(id)
        if(!folder){
            return res.status(404).json({erro:'Página não pôde ser encontrada'})
        }
        let newPath = folder.path.split(path.sep)
        const index = newPath.findIndex(dir => dir === 'uploads')
        newPath = newPath.filter((dir,i) => i > index)
        newPath = newPath.join('//')
        newPath = path.normalize(newPath);
        newPath += '.zip'
        const response ={
            url : `${URL}/files/${newPath}`,
            name : folder.title
        }
        console.log(response.url);
        if(fs.existsSync(folder.path+'.zip')){
            await fs.unlinkSync(folder.path+'.zip');
        }
        zip.zipFolder(folder.path,folder.path+'.zip', function(err) {
            if(err) {
                console.log('Something went wrong!', err);
                return res.status(500)
            }

            return res.status(200).json(response)
        }); 
    }
}

module.exports = new FolderController()
