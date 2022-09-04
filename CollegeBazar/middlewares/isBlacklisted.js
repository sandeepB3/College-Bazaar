const isBlacklisted=(req,res,next)=>{
if(req.user.status==="Blacklisted"){
    req.flash('error','You have been blacklisted by the admin!')
    return res.redirect('/')
}
next()
}
module.exports=isBlacklisted