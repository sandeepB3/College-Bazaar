var express = require('express');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const User = require('../models/user.js')
const passport = require('passport')
const isLoggedIn = require('../middlewares/isLoggedIn');
const isBlacklisted = require('../middlewares/isBlacklisted');
const Item = require('../models/item.js');
const multer = require('multer')
const { storage, cloudinary } = require('../cloudinary')
const upload = multer({
    storage
})
const {user}=require('../utils/users.js')
const wrapAsync=require('../utils/wrapAsync.js')
const customer=user
const joi=require('joi')
const validateItem=require('../middlewares/validateItem')


var router = express.Router();//The express.Router() function is used to create a new router object.


router.get("/", wrapAsync(async function (req, res) {
    const items = await Item.find({ "status": "Approved" }).populate('author')
    res.render("marketplace", { items })
}));

router.get('/addItem', isLoggedIn,isBlacklisted, (req, res) => {

    Item.find({ "author": req.user._id }, function (err, found) {
        if (!err) {
            res.render('addItems.ejs', { found });
        }
    })
})


router.post('/addItem', isLoggedIn,isBlacklisted,upload.array('image'), async (req, res) => {
    let { title, price, category, description } = req.body;
    // category=category.stringfy();
    const newItem = new Item({
        title: title,
        price: price,
        description: description

    })
    newItem.category = category
    newItem.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    newItem.author = req.user._id
    await newItem.save()
    req.flash('success', 'Item succesfully uploaded aiting for approval!')
    res.redirect("/addItem")
})


router.get('/viewItem/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params
    const item = await Item.findById(id).populate('author')
    res.render('viewItem', { item })
}))



////// SEARCH ROUTE

router.post('/tags', wrapAsync(async (req, res) => {
    const searchName = req.body.name
    // console.log(req.body)
    const items = await Item.find({ "title": searchName}).populate('author')
    res.render('marketplace', { items })

}))

//////////





////    CHAT ROUTES
router.get('/chat', isLoggedIn, (req, res) => {
    res.render('chat');
})

router.post('/joiningpage/:seller', isLoggedIn, (req, res) => {
    const sellerName = req.params.seller
    const user = req.user
    res.render('joiningPage',{user, sellerName});
})
/////
// router.post('/mychat/:me', isLoggedIn, (req, res) => {
//     const me = req.params.me
//     const user = req.user
//     res.render('joiningPage',{user, me});
// })







// CART AND WISHLIST
router.get('/cart', isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'cart',
        populate: {
            path: 'author'
        }
    })
    // console.log(user)
    res.render("cart", { user })
}))
router.post('/addToCart/:id', isLoggedIn,wrapAsync( async (req, res) => {
    const { id } = req.params
    const item = await Item.findById(id)
    const user = await User.findById(req.user._id)
    if (user.cart.length) {
        for (let item of user.cart) {
            if (item.equals(id)) {
                req.flash('warning','This item already exists in your Cart')
                return res.redirect('/cart')
            }
        }

    }
    user.cart.push(item._id)
    await user.save()
    res.redirect("/cart")
   

}))

router.delete("/deleteCart/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const _id = req.params.id
    await User.findByIdAndUpdate(req.user._id, { $pull: { cart: _id } })
    res.redirect("/cart")
}))

router.delete("/deleteWishlist/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const _id = req.params.id
    await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: _id } })
    res.redirect("/wishlist")
}))


router.get('/wishlist', isLoggedIn,wrapAsync( async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'wishlist',
        populate: {
            path: 'author'
        }
    })
    // console.log(user)
    res.render("wishlist", { user })
}))
router.post('/addToWishlist/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params
    const item = await Item.findById(id)
    const user = await User.findById(req.user._id)
    if (user.wishlist.length) {
        for (let item of user.wishlist) {
            if (item.equals(id)) {
                req.flash('warning','This item already exists in your Wishlist')
                return res.redirect('/wishlist')
            }
        }

    }
    user.wishlist.push(item._id)
    await user.save()
    res.redirect("/wishlist")
}))
/////

//USER ROUTES

router.get('/register', (req, res) => {
    res.render('login.ejs')
})

router.post('/register', wrapAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body
        const user = new User({ email, username })
        const registeredUser = await User.register(user, password)
        req.login(registeredUser, err => {
            if (err) {
                // console.log(err)
            }
            req.flash('success', 'Welcome to College Bazar!')
            res.redirect('/userDeets')
        })
    }
    catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }
}))

router.get('/userDeets', (req, res) => {
    const user = req.user;
    // console.log(user);
    // User.findByIdAndUpdate(user._id, function(req,res){

    // })
    res.render("userDeets")
})

router.put('/allDeets', wrapAsync(async (req, res) => {
    const user = req.user;
    await User.findOneAndUpdate({ _id: user._id }, { "$set": { "about": req.body.about, "college": req.body.college, "phone": req.body.phone, "location": req.body.city } })
    res.redirect("/")
}))

router.get('/login',(req, res) => {
    res.render('login.ejs');
})
router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), wrapAsync(async (req, res) => {
    res.redirect('/')
}))

router.get('/profile', isLoggedIn, wrapAsync(async (req, res) => {
    const user = req.user;
    const items = await Item.find({ "author": user._id });
    // console.log(items)
    console.log(customer)
    if(customer&&customer.length){
        req.flash('info', 'Customers are waiting for you in the chat')
    }
    res.render('profile', { usn: user.username, email: user.email, items: items, id: user._id, user });
}))

router.post('/delete', isLoggedIn, (req, res) => {
    let delItem = req.body.del;
    Item.findByIdAndDelete(delItem, function (err) {
        if (!err) {
                console.log("Item Deleted");
            res.redirect("back");
        }
    });
})

router.get('/edit/:item', isLoggedIn, (req, res) => {
    const id = req.params.item;
    // console.log(id);
    Item.findById(id, (err, item) => {
        if (!err) {
            res.render("editItem", { item });
        }
    })
});

router.put('/edit/:item', isLoggedIn, (req, res) => {
    const id = req.params.item;
    const { title, price, description } = req.body;
    // console.log(title)
    Item.findOneAndUpdate({ _id: id }, { "$set": { "title": title, "price": price, "description": description, "status":"Pending"} },
        function (err) {
            if (!err) {
                res.redirect("/addItem")
            }
        })

})
router.get("/logout", isLoggedIn, function (req, res) {
    req.logout(function (err) {
        // if (err) { console.log(err); }
    });
    req.flash("success", "Logged Out Succesfully");
    res.redirect("/login");
});
///Filter ROUTE

router.post('/pillFilter', wrapAsync(async (req, res) => {
    const { submit } = req.body;
    const items = await Item.find({ category: submit, status:"Approved" }).populate('author')
    res.render('marketplace.ejs', { items })

}))
module.exports = router;