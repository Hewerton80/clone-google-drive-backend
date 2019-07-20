const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const relationship = require("mongoose-relationship");
const {URL,PORT} = require('../../config/env')
const Schema = mongoose.Schema

const FileSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    path:{
        type:String,
        required:true   
    },
    mimetype:{
        type:String,
        required:true
    },
    size:{
        type:String,
        //required:true
    },
    folderFather:{
        type:Schema.Types.ObjectId, ref:'Folder',childPath:"files",
        required:true
    },
    folderToRestore:{
        type:Schema.Types.ObjectId, ref:'Folder',childPath:"folders",
    },
},
{
    timestamps : true, //adiciona os campos createdAt e updatedAt
    toObject:{ virtuals:true },
    toJSON:{ virtuals:true }    
});

FileSchema.plugin(relationship,{
    relationshipPathName : 'folderFather',
    triggerMiddleware    : true
})


FileSchema.virtual('url').get(  function() {
    let pathList =  this.path.split(path.sep)
    const index =  pathList.findIndex(dir => dir === 'uploads')
    pathList =  pathList.filter((dir,i)=> i >index)
    pathList = pathList.join('/')
    file =  `${URL}/files/${pathList}`

    return file
})
module.exports = mongoose.model('File',FileSchema)