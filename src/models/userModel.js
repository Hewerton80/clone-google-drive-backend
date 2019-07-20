const mongoose = require('../../config/mongoose')
const bcrypt = require('bcryptjs')
const Folder = require('./folderModel')
const file = require('./fileModel')
const Schema = mongoose.Schema


const UserSchema = Schema({
    name: {
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true
    },
    folders:[{
        type:Schema.Types.ObjectId, ref:'Folder',
    }],
    foldersPermition:[{
        type:Schema.Types.ObjectId, ref:'Folder',
    }],
    files:[{
        type:Schema.Types.ObjectId, ref:'File'
    }],
    password:{
        type:String,
        required:true,
        select:false
    },
    
    passwordResetToken:{
        type:String,
        default:undefined,
        select:false
    },
    passwordResetExpires:{
        type:Date,
        select:false,
    }
},{
    timestamps:true,
})

UserSchema.pre('save', async function(next){
    const hash = await bcrypt.hash(this.password,10)
    this.password = hash
    next()
})

module.exports = mongoose.model('User',UserSchema)