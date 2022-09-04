const mongoose=require('mongoose')
const passportLocalMongoose=require('passport-local-mongoose')
const Schema=mongoose.Schema
const findOrCreate = require("mongoose-findorcreate");

const userSchema= new Schema({
    // name :{
    //     type:String,
    //     required:true
    // },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type : String,
        default:123456789,
        $ifNull: [ "$phone", "Unfilled Data"]
    },
    status:{
        type:String,
        default:"Accepted",
        enum : ["Accepted", "Blacklisted"]
    },
    about:{
        type:String,
        default:"Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non nostrum odio cum repellat veniam eligendi rem cumque magnam autem delectus qui.",
        $ifNull: [ "$about", "Unfilled Data"]
    },
    college:{
        type : String,
        default: "Sardar Patel Institute of Technology"
    },
    location:{
        type : String,
        default: "Mumbai",
        $ifNull: [ "$location", "Unfilled Data"]
    },

    cart:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Item'
        }
    ],
    wishlist:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Item'
        }
    ]
    

})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);
module.exports=mongoose.model('User',userSchema)