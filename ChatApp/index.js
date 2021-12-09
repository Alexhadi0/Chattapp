const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const session = require('express-session');


app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


const users = (JSON.parse(fs.readFileSync('user.json')));
console.log(users);

let sessionUsername = '';
let sessionLoggedin = false;


///
app.get('/', function (req, res) {
    if (req.session.loggedIn == true)
        res.sendFile(__dirname + '/public/chat.html');
    else
        res.sendFile(__dirname + "/public/login.html");
});


///
app.post('/login', async function (req, res) {
    let userAccount = users.find(user => req.body.username == user.username);
    if (userAccount) {
        let userPassword = userAccount.password
        if (userPassword == req.body.password) {
            req.session.loggedIn = true;
            req.session.username = req.body.username;
            sessionUsername = req.session.username;
            sessionLoggedin = req.session.loggedIn;

            console.log(`${req.session.username} has logged in successfully.`);
            return res.redirect('/');
        }
        
    }
    else {
        console.log(`${req.body.username} has not been found in the database.`)
        res.redirect('/');
    }
});



//register
app.get('/register', (req, res) => {
    if (req.session.loggedIn == true) {
        res.sendFile(__dirname + '/public/chat.html');
    }
    else {
        res.sendFile(__dirname + '/public/register.html')
    }
});


//register post
app.post('/register', async (req, res) => {
    let userAccount = users.find((data) => data.username == req.body.username);
    console.log(req.body.username);
    if (!userAccount) {
        let newUser = {
            userID: '',
            username: req.body.username,
            password: req.body.password,
        }
        users.push(newUser);
        fs.writeFileSync('user.json', JSON.stringify(users, null, 4))
        res.redirect('/')
        console.log(`User ${newUser.username} has been registered successfully.`)
    }
    else {
        res.redirect('/register')
        console.log(`${req.body.username} has already been registered`);
    }
});



// Logs out a user.////
app.get('/logout', function (req, res) {
    console.log(`${req.session.username} has been logged out.`)
    req.session.destroy;
    req.session.loggedIn = false;
    sessionLoggedin = false;
    res.redirect('/');
});


app.get('/getusername', (req, res) => {
    res.send(req.session.username)
});


// När en användare ansluter eller disconnectar.///////////////
io.on('connection', (socket) => {
    if (sessionLoggedin == true) {
        let userAccount = users.find((data) => data.username == sessionUsername);
        userAccount.userID = socket.id;
        socket.user = userAccount.username;
        console.log(`User ${socket.user} with userID: ${userAccount.userID} (copied from new socket.id) connected`);
        text = `${socket.user} has connected.`
        io.emit('connecting', text);
 
        
        

   
    }

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


/////medelande till alla///
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        msg = `${socket.user}: ${msg}`
        io.emit('chat message', msg);
        console.log("trying to print on html")
    });
});

///User typing....///////
io.on('connection', (socket) => {
    socket.on('user typing', (typing) => {
        typing = `${socket.user} typing....`
        io.emit('user typing', typing);
        console.log(`${socket.user} typing....`)
    });
});


//Server//
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server startad på port: ${PORT}`);
});

