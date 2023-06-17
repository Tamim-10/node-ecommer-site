const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;
const mongoConnect = callback => {
  MongoClient.connect('mongodb+srv://tamim:jwyn0oloatQFaedn@cluster0.ey6uzuo.mongodb.net/shop').
  then(client =>{
    console.log(`Connected`);
    _db=client.db();
    console.log(`Connected to Datbase :${_db}`)
    callback();
  })
  .catch(err=>console.log(err));
}

const getDb = ()=>{
  if(_db){
    return _db;
  }
  throw 'No Database Found';  
} 

exports.mongoConnect=mongoConnect;//Exporting Database Connection
exports.getDb=getDb;//Exporting Database Name

//           username:password                                      Database Name
//mongodb+srv://tamim:jwyn0oloatQFaedn@cluster0.ey6uzuo.mongodb.net/test


