const router = require('express').Router()
const AuthMidlleware = require('../src/midllewares/authMidlleware')
const FolderController = require('../src/controllers/folderController')
const FileController = require('../src/controllers/fileController')
const multer = require('multer')
const multerMiddleware = require('../src/midllewares/multerMiddlware')
const upload = multer(multerMiddleware)


router.use('/mycloud',AuthMidlleware)
router.use('/trash',AuthMidlleware)
router.get('/teste',FolderController.teste)

//get mycoud and trash
router.get('/mycloud/:id',FolderController.show)
router.get('/trash/:id',FolderController.show)

//folder in mycloud
router.get('/mycloud/zip/folder/:id',FolderController.zip)
router.post('/mycloud/:id/store/folder',FolderController.store)
router.put('/mycloud/update/folder/:id',FolderController.upadate)
router.put('/mycloud/delete/folder/:id',FolderController.delete)
//file in mycloud
router.get('/mycloud/file/:id',FileController.get_file)
router.post('/mycloud/:id/store/file',upload.single('file'),FileController.store)
router.put('/mycloud/update/file/:id',FileController.update)
router.put('/mycloud/delete/file/:id',FileController.delete)
//folders in trash
router.put('/trash/restore/folder/:id',FolderController.restore)
router.delete('/trash/delete/folder/:id',FolderController.delete_permanently)
//files in trash
router.put('/trash/restore/file/:id',FileController.restore)
router.delete('/trash/delete/file/:id',FileController.delete_permanently)


module.exports = (app) => app.use(router)