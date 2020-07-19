const mc = require('mongodb').MongoClient;
let db;
const url = `${process.env.MONGO_PROTOCOL
              }://${process.env.MONGO_USER
              }:${process.env.MONGO_PASS
              }@${process.env.MONGO_HOST
              }/${process.env.MONGO_DB
              }${process.env.MONGO_OPTIONS}`;
const client = new mc(url, {useNewUrlParser: true, useUnifiedTopology: true,});

  const sleep = async () => {
    if(!db){
      try{
        const mdb = await client.connect()
        db = mdb.db(process.env.MONGO_DB)
      }
      catch(e){console.error(e)}
    }
    return db.collection('sleep')
  }

  const users = async () => {
    if(!db){
      try{
        const mdb = await client.connect()
        db = mdb.db(process.env.MONGO_DB)
      }
      catch(e){console.error(e)}
    }
    return db.collection('users')
  }

module.exports = {sleep, users}  