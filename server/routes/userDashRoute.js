var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var router = express.Router();
var pg = require('pg');

// require to upload images
var multer = require('multer');
var fs = require('fs');
var multerS3 = require('multer-s3');
var aws = require('aws-sdk');
var s3 = new aws.S3();

var connectionString = require('../modules/connection');

////////////////////////////////////////////////////////////
//                   UPLOAD FILES TO S3                   //
////////////////////////////////////////////////////////////

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'prime-digital-academy-herok9',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      // file name generation
      cb(null, Date.now().toString());
    }
  })
});

// upload post route to S3
router.post('/uploads', upload.single('file'), function(req, res) {
  console.log('in S3 post uploads:', req.file);
  res.send(req.file);
});

// get route to retrieve file names to display and then potentially allow users to delete too?
// router.get('/getFileNames', function(req, res) {
//   var results = [];
//   pg.connect(connectionString, function(err, client, done) {
//     var callDatabase = client.query('SELECT file name from k9s_certifications where k9_id equals x;');
//     // push each row in query into our results array
//     callDatabase.on('row', function(row) {
//       results.push(row);
//     }); // end query push
//     callDatabase.on('end', function(){
//       console.log('user files: ', results);
//       return res.json(results);
//     });
//     if(err) {
//       console.log(err);
//     }
//     done();
//   }); // end pg connect
// });


////////////////////////////////////////////////////////////
//                     POST ROUTES                        //
////////////////////////////////////////////////////////////

// send PDF URLs to k9s_certifications table
router.post('/submitPdf', function (req, res){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      console.log(err);
    } else {
      var sendFile = client.query('INSERT INTO k9s_certifications (id, k9_id, certification_id, url, notes) VALUES ($1, $2, $3, $4, $5)',
        [req.body.id, req.body.k9_id, req.body.certification_id, req.body.url, req.body.notes]);
        console.log('in submitPdf post route, adding:', req.body.url);
      sendFile.on('end', function(){
        done();
        return res.end();
      });
    }
  });
});

// send IMG URLs to k9_photos table
router.post('/submitImg', function (req, res){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      console.log(err);
    } else {
      var sendFile = client.query('INSERT INTO test (url) VALUES ($1)',
        [req.body.url]);
        console.log('in submitImg post route, adding:', req.body.url);
      sendFile.on('end', function(){
        done();
        return res.end();
      });
    }
  });
});

// send handler application data to k9s table
router.post('/submitK9App', function (req, res){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      console.log(err);
    } else {
      var results = [];
      var k9id = client.query('SELECT id FROM k9s WHERE user_id=($1)', [req.user.id]);

      k9id.on('row', function(row){
        results.push(parseInt(row.id));
        console.log('Row:', row);
      });

      k9id.on('end', function(){

        for (var i=0; i<results.length; i++){
          var sendFile = client.query('INSERT INTO k9s_certifications (k9_id, certification_id, url) VALUES ($1, $2, $3)', [results[i], req.body.certs[i], req.body.url]);
        }

        res.sendStatus(200);
      });
    }
  });
});

router.get('/getFormInfo', function (req, res){
  pg.connect(connectionString, function(err, client, done){

    var results = {
	username: req.user.first_name,
      certs: [],
      dogs: [],
      form_info: {
        breeds: [],
        vest_colors: [],
        vest_imprints: [],
        vest_imprint_colors: []
      }
    };


    //Get Certs
    var queryCerts = client.query('SELECT * from certifications');
    queryCerts.on('row', function(row){
      results.certs.push(row);
    });
    queryCerts.on('end', function(){

      //Get Dogs
      var queryDogs = client.query('SELECT * from k9s WHERE user_id=($1)', [req.user.id]);
      queryDogs.on('row', function(row){
        results.dogs.push(row);
      });
      queryDogs.on('end', function(){

		      //Get Form Information
		       var vest_colorQuery = client.query('SELECT unnest(enum_range(NULL::vest_color))');
		       vest_colorQuery.on('row', function(row){
             console.log('vestcolor row: ', row);
		         results.form_info.vest_colors.push(row.unnest);
             console.log('vestcolor array: ', results.form_info.vest_colors);
		       });

		       var vest_imprintQuery = client.query('SELECT unnest(enum_range(NULL::vest_imprint))');
		       vest_imprintQuery.on('row', function(row){
		         results.form_info.vest_imprints.push(row.unnest);
		       });

		       var vest_imprint_colorsQuery = client.query('SELECT unnest(enum_range(NULL::vest_imprint_color))');
		       vest_imprint_colorsQuery.on('row', function(row){
		         results.form_info.vest_imprint_colors.push(row.unnest);
		       });
			 vest_imprint_colorsQuery.on('end', function() {
				 //All done!
			      console.log('results: ', results);
				res.send(results);
			 });
      });

    });
  });
});







router.get('/', function(req, res){
	console.log('in router.get user dash');
	pg.connect(connectionString, function (err, client, done) {

	  var results = [];
	  var query = client.query("SELECT * FROM K9s");
	  console.log('results: ', results);
	  console.log('query: ', query);

	  query.on('row', function(row){
	    results.push(row);
	  });

	  query.on('end', function(){
      done();
	    res.send(results);
	  });

	});

    });


    router.post('/canine', function(req, res){
    	console.log('In userdash handlerform route');
    	pg.connect(connectionString, function (err, client, done) {

    		var addCertifications = client.query( 'INSERT INTO k9s_certifications ( k9_id, certification_id, url, notes ) VALUES ($1, $2, $3, $4)', [ 12, 2, 'www.blingbling.com', 'patrol certification' ] );

		for (var i=0; i<req.body.equipment.length; i++){
			client.query( 'INSERT INTO k9s_equipment ( k9_id, equipment_id ) VALUES ( $1, $2 )', [ result.rows[0].id, req.body.equipment[i] ] );
		} // end for loop

  //   		var addK9Photos = client.query( 'INSERT INTO k9s_photos ( url, k9_id ) VALUES ($1, $2)', [  ] );
		//
  //   		var addSquadPhotos = client.query( 'INSERT INTO squad_photos ( url, k9_id ) VALUES ($1, $2)', [  ] );
		//
  //   		var updateK9 = client.query( 'UPDATE K9s SET k9_bio = ($1), k9_back = ($2), k9_chest = ($3), k9_girth = ($4), k9_undercarriage = ($5), k9_vest_color = ($6), k9_vest_imprint = ($7), k9_vest_imprint_color = ($8), squad_make = ($8), squad_model = ($9), squad_year = ($10), squad_retirement = ($11) WHERE K9s.id = SOMETHINGSOMETHINGSOMETHING', [ req.body.placeholder ] );

    	});
    });



module.exports = router;
