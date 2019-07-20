const AuthController = require('../src/controllers/authController')
const router = require('express').Router()

// rotas de autenticação 
router.post('/auth/register',AuthController.register)
router.post('/auth/authenticate',AuthController.authenticate)
router.post('/auth/forgotpassword',AuthController.forgot_password)
router.post('/auth/resetpassword',AuthController.recover_password)


module.exports= (app) => app.use(router)