'user strict'

const { BadRequestError } = require('../core/error.response')
const shopModel = require('../models/shop.model')
const path = require('path')
const fs = require('fs')

class UserService {
    static updateAvatar = async (file, keyStore) => {
        if (!file) throw new BadRequestError('file not found')

        const user = await shopModel.findOne({ _id: keyStore.user }).lean();
        if(!user) throw new BadRequestError('user not found')
        
        const rs = await shopModel.updateOne({ _id: keyStore.user}, {avatar: file.filename})
        if (!rs.acknowledged) throw new BadRequestError('update avatar error')

        return {'user': {
                        '_id': user._id,
                        'name': user.name,
                        'email': user.email,
                        'avatar': user.avatar
                        }
                }       
    }

    static getImageUrl = async({ filename }) => {
        const filepath = path.join(__dirname, '../../uploads', filename)
        console.log('path', filepath)

        // Kiểm tra file có tồn tại không
        if (fs.existsSync(filepath)) 
          return fs.createReadStream(filepath)
        else 
          throw new BadRequestError('file not found')
    }
}

module.exports = UserService