'use strict'

const multer = require('multer')

const uploadFileHandler = () => {
    // SET STORAGE
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads')
        },
        
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now())
        }
    })
    
    const upload = multer({ storage: storage })

    return upload
}

module.exports = {
    uploadFileHandler
}