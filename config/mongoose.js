const mongoose = require('mongoose')

mongoose.set('useCreateIndex', true)
mongoose.connect('mongodb+srv://adao:adao@cluster0-qiqip.mongodb.net/mydrive?retryWrites=true&w=majority',
    {useNewUrlParser:true})
   //mongoose.connect('mongodb://localhost/mydrive',{useNewUrlParser:true})

mongoose.Promise = global.Promise;
module.exports = mongoose
