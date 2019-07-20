const PORT = 3001
module.exports = {
    PORT : process.env.PORT || PORT,
    TOKEN_SECRET:"a-3Sra7D/yM4s;tv>#)9ds_:,KFZE.[{Qe-BkGBvTx(x5M>-r:JyQF8(${4y",
    URL: process.env.URL || `http://localhost:${PORT}`,
    DATABASE : process.env.MONGODB_URI || 'mongodb+srv://adao:adao@cluster0-qiqip.mongodb.net/mycloud?retryWrites=true&w=majority' 
}