require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const {sleep, users} = require('./middle')
const { sign, verify } = require('jsonwebtoken')
const {compare} = require('bcrypt');
const cors = require('cors')
const cookieParser = require('cookie-parser')

app.use(cookieParser())
app.use(cors({preflightContinue: true, allowedHeaders: ['token'], exposedHeaders: ['token']}))
app.use(express.json())
app.use(express.urlencoded())
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'))
const port = process.env.port

app.get('/', (req,res) => {
    res.render(`login`)
})
app.post('/go', async (req,res) => {
    let db = await users()
    const user = await db.findOne({username: req.body.username})
    if(user){ // sign in if exists
        const match = await compare(req.body.password, user.password)
        if(match) {
            const token = sign(user, process.env.secret)
            res.cookie('token', token).redirect('/'+user.username)
        }else res.render('login', {msg: "User already exists and password is wrong"})
    }else{ // signup if don't
        const nu = {username:req.body.username}
        nu.password = await bcrypt.hash(req.body.password, 8)
        const {insertedId} = await db.insertOne()
        nu._id = insertedId
        const token = sign(nu, process.env.secret)
        res.header('token', token)
        res.redirect('/'+nu.username)
    }
})
app.get('/:user', (req,res) => {
    const token = req.cookies.token
    res.render(`index`, {username: req.params.user, token:token})
})

io.on('connection', async socket => {
    let db = await sleep()
    socket.on('save', function({new_ob, token}){
        if(token){
            const comming = verify(token, process.env.secret)
            if(comming.username === new_ob.user){
                if(new_ob._id !== undefined) new_ob._id = new require('mongodb').ObjectID(new_ob._id)
                else new_ob._id = new require('mongodb').ObjectID()
                db.replaceOne({_id: new_ob._id}, new_ob, {upsert:true}, success => {
                    var now = new Date();
                    var time = new Date(now.getFullYear(), now.getMonth(), 01);
                    var monthMili = time.getTime();
                    db.find({user: new_ob.user, startdate: {$gte:monthMili}}).toArray((err, records)=>{
                        if(err!=null){console.log(err);}
                        else socket.emit('saved', records)
                    })
                })
            } else socket.emit('msg', "you need to be the same user to do this")
        } else socket.emit('msg', "you need to be authenticated to do this")
        
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
	socket.on('del', async function({id, token}){
        
        let bid = new require('mongodb').ObjectID(id)
        let record = await db.findOne({_id:bid})
        if(token){
            const comming = verify(token, process.env.secret)
            if(comming.username === record.user){
                db.deleteOne({_id:bid}, function(success){
                    socket.emit('saved', success)
                });
            }else socket.emit('msg', "you need to be the same user delete it")
        }else socket.emit('msg', "you need to be authenticated to delete this")
        
  });
	
})

http.listen(port, () => console.log(`listening at ${port}`))