const mc = require('mongodb').MongoClient;
let db;
const url = `${process.env.MONGO_PROTOCOL
              }://${process.env.MONGO_USER
              }:${process.env.MONGO_PASS
              }@${process.env.MONGO_HOST
              }/${process.env.MONGO_DB
              }${process.env.MONGO_OPTIONS}`;
const client = new mc(url, {useNewUrlParser: true, useUnifiedTopology: true,});

  const connect = async () => {
    if(!db){
      try{
        const mdb = await client.connect()
        db = mdb.db(process.env.MONGO_DB).collection('sleep')
      }
      catch(e){console.error(e)}
    }
    return db
  }

module.exports = {connect}  