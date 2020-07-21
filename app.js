require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const {sleep, users} = require('./middle')
const { sign, verify } = require('jsonwebtoken')
const {compare, hash} = require('bcrypt');
const cors = require('cors')
const cookieParser = require('cookie-parser')
const sk_code = require('./socket')

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
        nu.password = await hash(req.body.password, 8)
        const {insertedId} = await db.insertOne(nu)
        nu._id = insertedId
        const token = sign(nu, process.env.secret)
        res.cookie('token', token).redirect('/'+nu.username)
    }
})
app.get('/:user', (req,res) => {
    const token = req.cookies.token
    res.render(`index`, {username: req.params.user, token:token})
})

io.on('connection', async socket => {
    let db = await sleep()
    socket.on('save', data => sk_code.save(data, socket))
	socket.on('take', id => sk_code.take(id, socket))
    socket.on('naps', data => sk_code.naps(data, socket));
	socket.on('del', data => sk_code.del(data, socket));
})

http.listen(port, () => console.log(`listening at ${port}`))