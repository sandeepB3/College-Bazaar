const Joi=require('joi')
module.exports.itemSchema = Joi.object({
    
        title: Joi.string().required(),
        price: Joi.number().required(),
        description: Joi.string().required(),
        category: Joi.string().required(),

    
})
