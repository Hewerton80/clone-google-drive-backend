module.exports = (io)=>{
	io.on('connection',socket=>{
	    socket.on('connectRoonUploads',idRoon=>{
	        socket.join(idRoon)
	    })
	})

	return (req,res,next )=>{
    	req.io = io
    	return next()
	}
}