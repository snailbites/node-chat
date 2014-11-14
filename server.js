// loading modules
var express = require('express'),
    ejs = require('ejs'),
    app = express();

// setting up app server
var http = require('http'),
    server = http.createServer(app),
    fs    = require('fs'),
    nconf = require('nconf'),
    io = require('socket.io').listen(server, { log: false });

// global vars
var userct = 0;

// set up views
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.configure(function(){ app.use(express.static(__dirname + '/public')); });

// assemble controllers
// all routing (gets/posts) goes in the ./controllers folder
var controllerFiles = fs.readdirSync('controllers');
controllerFiles.forEach(function (controllerFile) { 
    if (controllerFile.indexOf('.js') === -1) {
        return;
    } else {
        controllerFile = controllerFile.replace('.js', '');
        var controller = require('./controllers/' + controllerFile);
        controller.setup(app);
    }
});

// start listening on port
server.listen(3000, "0.0.0.0");

// set up events
io.sockets.on('connection', function(socket){
    userct++;
    console.log(socket.handshake.address.address + ' has entered the room');
    socket.broadcast.emit('welcome', { pseudo : returnPseudo(socket) });

    socket.on('message', function(data){
        var transmit = { date : new Date().toISOString(), pseudo : returnPseudo(socket), message : sanitizeHtml(data) };
        socket.broadcast.emit('message', transmit);
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('disconnect', { pseudo : returnPseudo(socket) });
        console.log(socket.handshake.address.address + ' has left the room');
    });
});

// set up user nconf
nconf.use('file', { file: './config/users.json'});
nconf.use('file', { file: './config/online.json'});
nconf.load();

// helper funcs
// Return the name of the user
function returnPseudo(socket) {
    var pseudo,
        address = getAddr(socket),
        name = nconf.get(address);

    return name || 'Anonymous' + userct ;
}
function getAddr(socket){
    return socket.handshake.address.address;
}
function listUsers(socket){

}
function sanitizeHtml (string) {
  return string.replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;')
}
