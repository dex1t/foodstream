/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

//app.listen(3000);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
var port = process.env.PORT || 3000;
app.listen(port, function(){
        console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
    });

// Main

var twitter = require('ntwitter');
var io = require('socket.io').listen(app);
var twitter = new twitter({
        consumer_key: 'TwitterDevページで入手',
        consumer_secret: 'TwitterDevページで入手',
        access_token_key: 'TwitterDevページで入手',
        access_token_secret: 'TwitterDevページで入手'
    });
word = ['meal', 'dinner', 'lunch', 'breakfast'];

io.sockets.on('connection', function(socket){
        io.sockets.emit("connect", "connect");
//        twitter.search(word, {include_entities: true}, function(err, data){
//                rdata = data.results.reverse();
//                rdata.forEach(function(data){
//                        expand_url(data.from_user, data);
//                    });
//            });
        twitter.stream('statuses/filter', {'track':word, include_entities:true},function(stream) {
                stream.on('data', function (data) {
                        expand_url(data.user.screen_name, data);
                    });
                stream.on('end', function (response) {
                        console.log("#-----stream end-----#");
                    });
                stream.on('destroy', function (response) {
                        console.log("#!!!!!stream destroy!!!!!#");
                    });
            });
        socket.on('disconnect', function(){
                console.log("disconnect");
            });
        socket.on('effect', function(data){
                console.log(data);
                io.sockets.emit("effect", data);
            });
    });

function expand_url(user, data){
    url = data.entities.urls[0];
    if (url){
        ex_url = url.expanded_url;
    }else if (data.entities.media){
        ex_url = data.entities.media[0].media_url;
    }else{
        return
    }

    if(ex_url){
        emit_url(ex_url, user, data);
    }
}

function emit_url(url, user, data){
    type = false;
    if(url.match('^http://instagr.am/p/')){
        id = url.split('/');
        media_url = "http://instagr.am/p/"+id[id.length-2]+"/media/";
        type = "image";
    }
    else if(url.match('^http://www.youtube.com/watch\\?v=')){
        url = url.replace('http://www.youtube.com/watch?v=', '');
        id = url.split('&');
        media_url = 'http://www.youtube.com/embed/'+id[0];
        type = "movie";
    }
    else if(url.match('^http://twitpic.com/')){
        id = url.split('/');
        media_url = "http://twitpic.com/show/thumb/"+id[id.length-1];
        type = "image";
    }
    else if(url.match('^http://p.twimg.com/')){
        media_url = url;
        type = "image";
    }
    if(type){
        io.sockets.emit(type, {twid:data.id,
                user:user,
                text:data.text,
                url:media_url});
    }
}
