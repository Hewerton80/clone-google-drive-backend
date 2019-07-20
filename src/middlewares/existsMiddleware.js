const Folder = require('../models/folderModel')

module.exports = async (req,res,next) =>{
	console.log('entrou no middlware de verificação de pasta');
	const id = req.params.id
	try{
		const folder = await Folder.findById(id).populate('folders files')
		if(!folder){
			return res.status(404).json({erro:'página não encontrada'})
		}
		req.folder = folder
		next()
	}
	catch(err){
		console.log(err);
		return res.status(404).json({erro:'página não encontrada'})

	}
}