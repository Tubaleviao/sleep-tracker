# sleep tracker

A online tool to keep track of your sleep logs. Extremely useful for polyphasic sleep users.

## how to start

You need a MongoDB database in order to make it work. Create a ".env" file into your project folder with the following information:

```
port=3000
MONGO_HOST=your_mongodb_uri_host
MONGO_USER=your_database_username
MONGO_PASS=your_database_passwoed
MONGO_PORT=27017
MONGO_DB=test
MONGO_PROTOCOL="mongodb+srv"
MONGO_OPTIONS="?retryWrites=true&w=majority"
secret="create_a_secret_for_your_jwt_token"
```

After that, just run the following:

```
npm install
node app.js
```
