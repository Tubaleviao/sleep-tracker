const {sleep, users} = require('./middle')
const { sign, verify } = require('jsonwebtoken')
const {compare, hash} = require('bcrypt');
const cors = require('cors')
const cookieParser = require('cookie-parser')
const sk_code = require('./socket')



const save = async ({new_ob, token}, socket) => {
    let db = await sleep()
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
}

const take = async (id, socket) => {
    let db = await sleep()
    let bid = new require('mongodb').ObjectID(id)
    db.findOne({_id: bid}, function(err, nap){
        if(err){console.log(err);}
        else socket.emit('took', nap)
    });
}

const naps = async (data, socket) => {
    let db = await sleep()
    var now = new Date();
    var time = new Date(now.getFullYear(), now.getMonth(), 01);
    var monthMili = time.getTime();
    db.find({user: data.user, startdate: {$gte:monthMili}}).toArray((err, records)=>{
        if(err!=null){console.log(err);}
        else socket.emit('saved', records)
    });
}

const del = async ({id, token}, socket) => {
    let db = await sleep()
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
    
}

module.exports = {save, take, naps, del}