const path = require('path')
const find = require('find')
const User = require('./userModel')
const mongoose = require('mongoose')
const relationship = require("mongoose-relationship");
const Schema = mongoose.Schema


const FolderSchema = Schema({
    title:{
        type:String,
        required:true,
        
    },
    path:{
        type:String,
        //select: false  
    },
    pathList:{
        type:String,
    },

    folderFather:{
        type:Schema.Types.ObjectId, ref:'Folder',childPath:"folders",
    },
    folderToRestore:{
        type:Schema.Types.ObjectId, ref:'Folder',childPath:"folders",
    },
    folders:[{
        type:Schema.Types.ObjectId, ref:'Folder'
    }],

    files:[{
        type:Schema.Types.ObjectId, ref:'File'
    }]

},{
    timestamps:true,
    toObject:{ virtuals:true },
    toJSON:{ virtuals:true }
})

FolderSchema.plugin(relationship,{
    relationshipPathName : 'folderFather',
    triggerMiddleware    : true
})

FolderSchema.virtual('info').get(function(){
    
})

FolderSchema.pre('save', async function(next){
    let pathList = await this.path.split(path.sep)
    const index = await pathList.findIndex(dir => dir === 'uploads')

    pathList = await pathList.filter((dir,i)=> i >= index)
    await pathList.shift()
    await pathList.shift()
    pathList = pathList.join(' >> ')
    this.pathList = pathList
    next()
})

module.exports = mongoose.model('Folder',FolderSchema)