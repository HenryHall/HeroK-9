var express = require('express');
var path = require('path');
var pg = require('pg');

// require module functions
var encryptLib = require('../modules/encryption');
var connection = require('../modules/connection');

var router = express.Router();

router.get('/', function(req, res) {
  res.sendFile(path.resolve('public/views/register.html'));
});

router.post('/', function(req, res) {
  console.log('we hit the register route ', req.body);
  console.log('req.body.username = ', req.body.email);
  console.log('req.body.password = ', req.body.password);

  //test the db connection
  pg.connect(connection, function (err, client, done) {

    var userToSave = {
      email: req.body.email,
      password: encryptLib.encryptPassword(req.body.password)
    };

    //client.query takes the query, params, and optional callback
    client.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [userToSave.email, userToSave.password],
        function(err, result) {

          done();

          if(err){
            console.log(err);
            res.sendStatus(500);
          }else{
            //redirect to get on / route
            console.log('id of registered user = ', result.rows[0].id);
            res.redirect('/');
          }
    });
  });
});

module.exports = router;
