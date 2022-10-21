require('dotenv').config()
var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo');
var path = require('path');
const flash = require('connect-flash')
const methodOverride = require('method-override')
require('dotenv').config({ path: '.env' })
const ejsMate = require('ejs-mate')
const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user')
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users')
const expressError = require('./utils/expressError')



//connecting mongoose
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
const server=http.createServer(app)
const io=socketio(server)
const botName='Bazaar Bot'



//set views for ejs (app.set)
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');

//use bodyParser and express (app.use)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'))

app.use(express.static("public"));//must be needed when creating a public folder for images and css
app.use(express.static(__dirname + '/utils'));
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
    secret: "work hard",
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

// passport.use(User.createStrategy());
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// passport.serializeUser(function(user,done){
//     done(null,user.id);
//   });

// passport.deserializeUser(function(id, done){
//     User.findById(id, function(err,user){
//       done(err,user);
//     });
//   });
app.use((req,res,next)=>{
    const currentUser=req.user
    console.log("Current user:"+req.user)
    next()
})


app.use((req,res,next)=>{
    res.locals.currentUser=req.user
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    res.locals.info=req.flash('info')
    res.locals.warning=req.flash('warning')
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

// Run when client connects
io.on("connection", (socket) => {
    
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to Bazaar Chat!"));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  }); 
// error handler
// define as the last app.use callback
app.all('*',(req,res,next)=>{
  next(new expressError('Page Not Found',404))
})
app.use((err,req,res,next)=>{
  const {statusCode=500}=err
  if(!err.message) err.message='Something went wrong :/'
  res.status(statusCode).render('error',{err})
})

//listen on port
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
    console.log('Server is started on http://127.0.0.1:' + PORT);
});
