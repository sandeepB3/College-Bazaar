const mongoose = require('mongoose')
const Schema = mongoose.Schema
const opts = { toJSON: { virtuals: true } }

const ImageSchema = new Schema({
    url: String,
    filename: String
})
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/c_crop,h_200,w_300')
})
const itemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    images: [ImageSchema],
    
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        default: "Pending",
        enum: ['Pending', 'Rejected', 'Accepted'],
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
        enum: ['books', 'stationary', 'utility','electronic'],
        subcategory: [{ type: String }]
    }

})


module.exports = mongoose.model('Item', itemSchema)