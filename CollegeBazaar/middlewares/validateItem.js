const {itemSchema} = require('../itemSchema')
const expressError = require('../utils/expressError')
const validateItem = (req,res,next)=>{
    const {error} = itemSchema.validate(req.body)
    if(error){
        const msg=error.details.map(el=>el.message).join(',')
        throw new expressError(msg,400)
    }
    else{
        next()
    }
}
module.exports=validateItem