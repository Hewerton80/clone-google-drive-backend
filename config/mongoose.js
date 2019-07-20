const mongoose = require('mongoose')
const {DATABASE} = require('./env')

mongoose.set('useCreateIndex', true)
mongoose.connect(DATABASE,{useNewUrlParser:true})
   //mongoose.connect('mongodb://localhost/mydrive',{useNewUrlParser:true})

mongoose.Promise = global.Promise;
module.exports = mongoose
