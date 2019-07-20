const User = require('../models/userModel')
const Folder = require('../models/folderModel')
const File = require('../models/fileModel')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const find = require('find')
const {zip} = require('zip-a-folder')
const getSize = require('get-folder-size');
const {URL} = require('../../config/env')

class FolderController{
    async get_folder(req,res){
        try{
            const id = req.params.id
            const folder = await Folder.findById(id).populate('folders files')
            if(!folder){
                return res.status(404).json({erro:'página não pôde ser encontrada'})
            }
            getSize(folder.path, (err, size) => {
                if (err){
                    return res.status(500).json({erro:'erro'})
                }
                return res.status(200).json({folder,size:(size / 1024 / 1024).toFixed(2)})
            });
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        } 
    }
    async show(req,res){
        try{
            const folder = req.folder
            //console.log(folder);
            //const foldetFather = await Folder.findById(folder.folderFather)
            return res.status(200).json(folder)
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        } 
    }
    async store(req,res){
        try{
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
           
            await fs.mkdirSync(pathNewFolderChild,{recursive:true})
            newFolderChild.path = await pathNewFolderChild
            await folderFather.save()// adiciona o newFolderchild ao folderFather
            await newFolderChild.save()
            //req.io.sockets.emit(folderId).emit('folder',newFolderChild)
            // folderID é o id da sala
            
            const user = await User.findById(req.userId).select('+password')
            await user.foldersPermition.push(newFolderChild)
            await user.save()
            return res.status(200).json(folderFather)
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        } 
        
    }
    async upadate(req,res){
        try{
            let title = req.body.title.trim()
            const idfolder = req.params.id
            const folder = await Folder.findById(idfolder).populate('folders files')
            if(!folder){
                return res.status(404).json({erro:"página não pôde ser encontrada"})
            }
            const folderFather = await Folder.findById(folder.folderFather)
            const newPath = path.join(folderFather.path,`${title} -- ${folder._id}`)
            await fs.renameSync(folder.path,newPath)

            //autualizando o path dos diretórios filhos
            const newPathDirs =  await find.dirSync(newPath)
            //console.log(newPathDirs);
            newPathDirs.forEach(async dir=>{
                //console.log('\n'+dir+'\n')
                let idPath = dir.split(path.sep)
                idPath = idPath[idPath.length-1]
                let [,idFodler] = idPath.split(' -- ')
                let f = await Folder.findById(idFodler)
                //console.log(f.title);
                if(f){
                    
                    f.path = dir
                    await f.save()
                }
                
            })
            //------
            
            //autualizando o path dos arquivos filhos
            const newPathFiles =  await find.fileSync(newPath)
            //console.log(newPathDirs);
            newPathFiles.forEach(async dir=>{
                //console.log('\n'+dir+'\n')
                let idPath = dir.split(path.sep)
                idPath = idPath[idPath.length-1]
                let [idFile,] = idPath.split(' -- ')
                let f = await File.findById(idFile)
                //console.log(f.title);
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
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        }
    }
    async delete(req,res){
        try{
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
            fse.move(folderChild.path, newPath ,async (err)=>{
                if(err){
                    console.log('erro :)--.>>'+err);
                    return res.status(400).json({erro:'pasta não pôde ser deletada'})
                }
                //autualizando o path dos diretórios filhos
                const newPathDirs =  await find.dirSync(newPath)
                //console.log(newPathDirs);
                newPathDirs.forEach(async dir=>{
                    //console.log('\n'+dir+'\n')
                    let idPath = dir.split(path.sep)
                    idPath = idPath[idPath.length-1]
                    let [,idFodler] = idPath.split(' -- ')
                    let f = await Folder.findById(idFodler)
                    //console.log(f.title);
                    if(f){
                        
                        f.path = dir
                        await f.save()
                    }
                    
                })
                //------
                
                //autualizando o path dos arquivos filhos
                const newPathFiles =  await find.fileSync(newPath)
                //console.log(newPathDirs);
                newPathFiles.forEach(async dir=>{
                    //console.log('\n'+dir+'\n')
                    let idPath = dir.split(path.sep)
                    idPath = idPath[idPath.length-1]
                    let [idFile,] = idPath.split(' -- ')
                    let f = await File.findById(idFile)
                    //console.log(f.title);
                    if(f){
                        
                        f.path = dir
                        await f.save()
                    }
                    
                })
                //------
                folderChild.path = newPath
                folderChild.folderToRestore = await folderChild.folderFather._id//pasta para qual ele retornará caso seja restaurado
                folderChild.folderFather = await trash._id// o pai agora é alixeira
                await trash.save() 
                await folderChild.save()
                return res.status(200).json(folderFather)
            })
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        }
    }
    async delete_permanently(req,res){
        try{
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
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        }
    }
    async restore(req,res){
        try{
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
            fse.move(folderChild.path, newPath , async(err)=>{
                if(err){
                    console.log(err);
                    return res.status(400).json({erro:'pasta não pôde ser restaurada'})
                }
                //autualizando o path dos diretórios filhos
                const newPathDirs =  await find.dirSync(newPath)
                //console.log(newPathDirs);
                newPathDirs.forEach(async dir=>{
                    //console.log('\n'+dir+'\n')
                    let idPath = dir.split(path.sep)
                    idPath = idPath[idPath.length-1]
                    let [,idFodler] = idPath.split(' -- ')
                    let f = await Folder.findById(idFodler)
                    //console.log(f.title);
                    if(f){
                        
                        f.path = dir
                        await f.save()
                    }
                    
                })
                //------
                
                //autualizando o path dos arquivos filhos
                const newPathFiles =  await find.fileSync(newPath)
                //console.log(newPathDirs);
                newPathFiles.forEach(async dir=>{
                    //console.log('\n'+dir+'\n')
                    let idPath = dir.split(path.sep)
                    idPath = idPath[idPath.length-1]
                    let [idFile,] = idPath.split(' -- ')
                    let f = await File.findById(idFile)
                    //console.log(f.title);
                    if(f){
                        
                        f.path = dir
                        await f.save()
                    }
                    
                })
                //------
                folderChild.path = newPath
                folderChild.folderToRestore =  undefined
                folderChild.folderFather = myCloud._id
                await myCloud.save()
                await trash.save()
                await folderChild.save()
                return res.status(200).json({msg:"pasta restaurada com sucesso :)"})
            })
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        }
    }

    async zip(req,res){
        const id = req.params.id
        const folder = await Folder.findById(id)
        try{
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
            if(fs.existsSync(folder.path+'.zip')){
                await fs.unlinkSync(folder.path+'.zip');
            }
            await zip(folder.path,folder.path+'.zip')
            return res.status(200).json(response)
        }
        catch(err){
            console.log(err);
            return res.status(500).json({err:'Erro'})
        }
    }
        

}

module.exports = new FolderController()