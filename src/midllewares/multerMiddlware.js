const multer = require('multer')
const crypto = require('crypto')
const path = require('path')
const Folder = require('../models/folderModel')
const File = require('../models/fileModel')


const destUploads = path.resolve(__dirname,'..','..','uploads','tmp')
Multer = {
    storage : multer.diskStorage({
        destination: async function (req, file, cb) {
            console.log('---------passou poelo multer-----------\n\n\n')
            console.log('id: ' + req.params.id)
            const folderFather = await Folder.findById(req.params.id)
            req.folderFatherPath = folderFather.path
            req.folderFather_id = folderFather.id
            console.log('folderFather.path: '+folderFather.path)
            cb(null, folderFather.path)
        },
        filename: async function (req, file, cb){
            const newFile = await new File({
                title        : file.originalname,
                mimetype     : file.mimetype,
                folderFather : req.folderFather_id,
            })
            const key = newFile._id +' -- '+file.originalname
            newFile.path = path.join(req.folderFatherPath,key)
            console.log('newFile:' + newFile.path)
            await newFile.save()
            req.newFile = newFile

            cb(null, key)
        }
    })
}
module.exports = Multer