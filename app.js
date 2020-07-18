require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const {connect} = require('./middle')

app.use(express.static('public'))
const port = process.env.port

app.get('/', (req,res) => {
    res.sendFile(`${__dirname}/index.html`)
})

io.on('connection', async socket => {
    let db = await connect()
    socket.on('save', function(data){
        if(data._id !== undefined) data._id = new require('mongodb').ObjectID(data._id)
        else data._id = new require('mongodb').ObjectID()
        db.replaceOne({_id: data._id}, data, {upsert:true}, success => {
            var now = new Date();
            var time = new Date(now.getFullYear(), now.getMonth(), 01);
            var monthMili = time.getTime();
            db.find({user: data.user, startdate: {$gte:monthMili}}).toArray((err, records)=>{
                if(err!=null){console.log(err);}
                else socket.emit('saved', records)
            });
        });
    });
	socket.on('take', function(id){
        let bid = new require('mongodb').ObjectID(id)
        db.findOne({_id: bid}, function(err, nap){
            if(err){console.log(err);}
            else socket.emit('took', nap);
        });
    });
    socket.on('naps', function(data){
        var now = new Date();
        var time = new Date(now.getFullYear(), now.getMonth(), 01);
        var monthMili = time.getTime();
        db.find({user: data.user, startdate: {$gte:monthMili}}).toArray((err, records)=>{
            if(err!=null){console.log(err);}
            else socket.emit('saved', records)
        });
    });
	socket.on('del', function(id){
        let bid = new require('mongodb').ObjectID(id)
        db.deleteOne({_id:bid}, function(success){
            socket.emit('saved', success);
        });
  });
	
})

http.listen(port, () => console.log(`listening at ${port}`))