var express = require('express');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const User = require('../models/user.js')
const passport = require('passport')
const isLoggedIn = require('../middlewares/isLoggedIn');
const Item = require('../models/item.js');
const multer = require('multer')
const { storage, cloudinary } = require('../cloudinary')
const upload = multer({
    storage
})


var router = express.Router();//The express.Router() function is used to create a new router object.


router.get("/", async function (req, res) {
    const items = await Item.find({ "status": "Approved" }).populate('author')
    res.render("marketplace", { items })
});

router.post('/tags', async (req, res) => {
    const searchName = req.body.name;
    // console.log(req.body)
    const items = await Item.find({ "title": searchName }).populate('author')
    // console.log(items)
    res.render('marketplace.ejs', { items })

})



router.get('/manageItem', async (req, res) => {
    const items = await Item.find({ "status": "Pending" }).populate('author')
    res.render('itemList', { found: items })
})

router.post('/pillFilter', async (req, res) => {
    const { submit } = req.body;
    const items = await Item.find({ category: submit, status:"Approved" }).populate('author')
    res.render('marketplace.ejs', { items })

})

router.get('/manageUser', async (req, res) => {
    User.find((err, users) => {
        if (!err) {
            // console.log(users)
            res.render('users', { users })
        }
    });
});

router.get('/viewItem/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params
    const item = await Item.findById(id).populate('author')
    res.render('viewItem', { item })
})

router.post('/userStatus/:id', async (req, res) => {
    const userID = req.params.id
    // console.log(user);
    const status = req.body.status;
    // console.log(status);
    const query = {
        _id: userID
    }


    if (status === "accept") {
        update = "Accepted";
    } else if (status === "blacklist") {
        update = "Blacklisted";
    }
    User.findOneAndUpdate(
        query,
        {
            status: update
        },
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    )
    res.redirect("/manageUser")
});


router.post('/itemStatus/:id', async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    
    const item=await Item.findById(id)
    item.status=status
    await item.save()
    res.redirect('/manageItem')
    

})

router.get('/profile/:id', async (req, res) => {
    const id = req.params.id;
    // console.log(id);
    const items = await Item.find({ author: id });
   
    const user = await User.findById(id)
    
    res.render('profile', { usn: user.username, email: user.email, items: items, id: user._id, user });
})




router.get('/register', (req, res) => {
    res.render('login.ejs')
})

// router.post('/register', async (req, res) => {

//     const { email, username, password } = req.body
//     const user = new User({ email, username })
//     const registeredUser = await User.register(user, password)
//     res.redirect('/')
// })

router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body
        const user = new User({ email, username })
        const registeredUser = await User.register(user, password)
        req.login(registeredUser, err => {
            if (err) {
                // console.log(err)
            }
            req.flash('success', 'Welcome Admin!')
            res.redirect('/')
        })
    }
    catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }
})



router.get('/login', (req, res) => {
    res.render('login.ejs');
})
router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), async (req, res) => {
    res.redirect('/')
});

router.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) { console.log(err); }
    });
    req.flash("success", "Logged Out Succesfully");
    res.redirect("/login");
});

module.exports = router;