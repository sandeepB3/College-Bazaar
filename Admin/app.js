var express = require('express');//
var ejs = require('ejs');//
var bodyParser = require('body-parser');
var mongoose = require('mongoose');//
var session = require('express-session');//
var MongoStore = require('connect-mongo');//
var path = require('path');//
const flash = require('connect-flash')
const methodOverride=require('method-override')//
require('dotenv').config({ path: '.env' })//
const ejsMate=require('ejs-mate')
const passport=require('passport')
const localStrategy=require('passport-local')
const User=require('./models/user')

//connecting mongoose
// console.log(typeof(process.env.MONGOURL));
mongoose.connect(process.env.MONGO_URL,
    (err) => {
        if (!err) {
            console.log('MongoDB Connection Succeeded.');
        } else {
            console.log('Error in DB connection : ' + err);
        }
    });


//creating app
var app = express();

//set views for ejs (app.set)
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');

//use bodyParser and express (app.use)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'))

app.use(express.static("public"));//must be needed when creating a public folder for images and css
app.use(express.static(__dirname + '/views'));


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
});


const sessionStorage = MongoStore.create({
    mongoUrl: process.env.MONGO_URL
})
//sessions (refer npm express-session documentation)
app.use(session({
    secret:'work hard',
    resave: true,
    saveUninitialized: false,
    store: sessionStorage,
    cookie: {
        httpOnly:true,
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7
    }
}));
app.use(flash())
app.use(passport.initialize())
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use((req,res,next)=>{
    res.locals.currentUser=req.user
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next();
})
var index = require('./routes/index');
app.use('/', index);


//catch 404 error and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('File Not Found');
    err.status = 404;
    next(err);
});



// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

//listen on port
const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
    console.log('Server is started on http://127.0.0.1:' + PORT);
});
