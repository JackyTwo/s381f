var express = require('express');
var engines = require('consolidate');
var logger = require('morgan')
var app = express();
var MongoClient = require('mongodb').MongoClient
var mongoUrl = 'mongodb://001:001@ds121456.mlab.com:21456/project'
var assert = require('assert')
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload');
var ObjectID = require('mongodb').ObjectID;
var favicon = require('serve-favicon')
//var cookieParser = require('cookie-parser');
var fs = require('fs');
app.use(bodyParser.json());
var cookieSession = require('cookie-session')

global.userSession = new Set()

global.userNow;
global.rnum;
global.register;
global.ratenum;
app.use(cookieSession({
  name: 'session',
   keys: ['project'],
    
maxAge: 24 * 60 * 60 * 1000
}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(fileUpload());
app.use(bodyParser.urlencoded( {extended: true} ));

app.set('view engine', 'ejs');


MongoClient.connect(mongoUrl, function(err, db){
	assert.equal(null,err);
	console.log("Connection to MongoDB");
	
	global.r = db.collection('restaurants')
	global.user = db.collection('user')

	app.get('/', function(req,res) {
	


		console.log(req.session.username);
		if (typeof req.session.username === 'undefined'){
		    	res.render('index');	
		console.log('Login now');
	    } else { res.redirect('/restaurant'); }
	})
	

	db.collection("restaurants").find({}).count(function (e, count){

	console.log("Count:"+count);
		
	global.rnum = count+1
	console.log("Now"+rnum);
	 });

	db.collection("restaurants").find({grades:{}}).count(function (e, count){

	console.log("Rate Count:"+count);
		
	global.ratenum = count+1
	console.log("Now"+ratenum);
	 });

	function findrt(db,rtSet,fields,callback) {
	  var cursor = db.collection("restaurants").find(rtSet);
	  var rts = [];

	  cursor.each(function(err,doc) {
	    assert.equal(err,null);
	    if (doc != null) {
	      rts.push(doc);
	    } else {
	      callback(rts);
	    }
	  });
	}

	function insertPhoto(db,r,callback) {
	  db.collection('restaurants').insertOne(r,function(err,result) {
	    assert.equal(err,null);
	    console.log("insert was successful!");
	    console.log(JSON.stringify(result));
	    callback(result);
	  });
	}
	app.post('/restaurant/create', function(req,res) {
	  console.log(req.body.rtname); 
//-------------------------no upload and upload image-----------------------------------------
	 if (req.files.filetoupload) {
		var file = req.files.filetoupload,
	
		   filename = file.name;
			mimetype = file.mimetype;
	 if (!(typeof filename === 'undefined')){
		file.mv("./"+filename,function(err){
			if(err){
				console.log(err)
				res.send("error")
			} else {
			   console.log("Done!")
			}
		})}
	 }
//---------------------------------------------------------------------------------------------
	
	  var rtname = (req.body.rtname.length > 0) ? req.body.rtname : "";
	  var borough = (req.body.borough.length > 0) ? req.body.borough : "";
	  var cuisine = (req.body.cuisine.length > 0) ? req.body.cuisine : "";

	  var photo = filename;
	  var mimetype = mimetype;

	  var street = (req.body.street.length > 0) ? req.body.street : "";
	  var building = (req.body.building.length > 0) ? req.body.building : "";
	  var zipcode = (req.body.zipcode.length > 0) ? req.body.zipcode : "";
	  var lat = (req.body.lat.length > 0) ? req.body.lat : "22.316151";
	  var lon = (req.body.lon.length > 0) ? req.body.lon : "114.180340";

	  console.log("restaurant = " + rtname);
	  console.log("photo = " + filename);
	 
	  var exif = {};
	  var image = {};
	  image['image'] = filename;

	  try {
	    new ExifImage(image, function(error, exifData) {
	      if (error) {
		console.log('ExifImage: ' + error.message);
	      }
	      else {
		exif['image'] = exifData.image;
		exif['exif'] = exifData.exif;
		exif['gps'] = exifData.gps;
		console.log('Exif: ' + JSON.stringify(exif));
	      }
	    })
	  } catch (error) {}
	  if (typeof filename === 'undefined') {

              
	      	var form = {};
		var form2 = {};

		
		console.log("Now2: "+global.rnum);
		form['address'] = form2;
		form2['street'] = street;
		form2['zipcode'] = zipcode;
		form2['building'] = building;
		form2['coord'] = [lat,lon];
		form['grades'] = [];
		form['borough']= borough;
		form['cuisine']= cuisine;
		form['restaurantName']= rtname;
		form['userid']= global.userNow;
		form['restaurant_id']= global.rnum;

		form['mimetype'] = mimetype;
		form['image'] = "null";
		form['exif'] = exif;
		insertPhoto(db,form,function(result) {

		res.render("new")
		//res.send('Photo was inserted into MongoDB!');
	      })

	  }
	else {  
	  fs.readFile(filename, function(err,data) {
		var form = {};
		var form2 = {};

		
		console.log("Now2: "+global.rnum);
		form['address'] = form2;
		form2['street'] = street;
		form2['zipcode'] = zipcode;
		form2['building'] = building;
		form2['coord'] = [lat,lon];
		//form['grades'] = [];
		form['borough']= borough;
		form['cuisine']= cuisine;
		form['restaurantName']= rtname;
		form['userid']= global.userNow;
		form['restaurant_id']= global.rnum;

		form['mimetype'] = mimetype;
		form['image'] = new Buffer(data).toString('base64');
		form['exif'] = exif;
		insertPhoto(db,form,function(result) {

		res.render("new")
		//res.send('Photo was inserted into MongoDB!');
	      })
	})}


	});

	app.get("/restaurant", function(req,res) {
		
		var name = req.param('name') ? req.param('name') : "";
		var borough = req.param('borough')? req.param('borough') : "";
		var cuisine = req.param('cuisine')? req.param('cuisine') : "";		
		var userid = req.param('userid')? req.param('userid') : "";

		var list = {};

		
		if (name != "") {
		list['restaurantName'] = name;
		}
		if (borough != "") {
		list['borough'] = borough;
		}
		if (cuisine != "") {
		list['cuisine'] = cuisine;
		}
		
		if (userid != "") {
		list['userid'] = userid;
		}
		console.log(req.param);
		
		findrt(db,list,{_id:1, restaurantName:1},function(rts) {
		      console.log('Finish list');

		      res.status(200);
		      res.render("restaurant",{r:rts , username: req.session.username, list:list});
		})
		
	    
		//res.render('restaurant');
	})

	app.get('/display', function(req,res) {
  		 

 
	    var criteria = {};
	    criteria['_id'] = ObjectID(req.query._id);
	    
	    findrt(db,criteria,{},function(rt) {
	      	console.log('coord = ' + rt[0].address.coord);
	 	console.log('grades = ' + rt[0].grades);
	    var a = [];
		a = rt[0].address.coord;
	      console.log('lat  = ' + a[0] + 'lon = '+a[1]);
	      console.log('Restaurant returned = ' + rt.length);
		var lat = a[0];
		var lon = a[1];
	      
	      console.log(lat,lon);      
	      res.status(200);
	      res.render("information",{r:rt[0],lat:a[0],lon:a[1],username:req.session.username});
	    });
	   
	});
	
	app.get("/register", function(req,res) {
		
		res.render('register')
	})

	app.post("/register", function(req,res) {
		var userid = req.body.username;
		var pw = req.body.password;
		var pw2 = req.body.password2;
		
		try {
			if (pw != pw2) throw ("Passwords are not match")
		new Promise(function (resolve, reject) {
                global.user.find({
                    userid: userid
                }).limit(1).toArray(function (err, data) {
                    resolve(data)
			console.log(data.length);
                })
            }).then(function (data) {
                if (data.length > 0) {res.send('<script>alert("Register Fail : Username is used");window.history.back()</script>')}
               else{ return global.user.insert({
                    userid,
                    pw
                })}
            }).then(function () {
                res.send('<script>alert("Register Finish");window.history.back()</script>')
            })
        }	catch (err) {
            res.send('<script>alert("Register Fail : '+err+'");window.history.back()</script>')
        }
    })

		

	app.post("/restaurant", function(req,res) {

		var name = req.param('name') ? req.param('name') : "";
		var borough = req.param('borough')? req.param('borough') : "";
		var cuisine = req.param('cuisine')? req.param('cuisine') : "";		
		var userid = req.param('userid')? req.param('userid') : "";

		var list = {};
		
		if (name != "") {
		list['restaurantName'] = name;
		}
		if (borough != "") {
		list['borough'] = borough;
		}
		if (cuisine != "") {
		list['cuisine'] = cuisine;
		}
		
		if (userid != "") {
		list['userid'] = userid;
		}
		console.log(req.param);

		findrt(db,list,{_id:1, restaurantName:1},function(rts) {
		console.log('Finish list');
		
		
		console.log(req.param);
		      res.status(200);
		      res.render("restaurant",{r:rts,username:req.session.username,list:list});
			})
		
	})
	
	app.get("/api/restaurant/read/:a/:b", function(req,res) {
		console.log('Incoming requesting: ' + req.method);
		console.log('Path ' + req.path);
		var a = req.params.a
		var b = req.params.b
		if ((['name', 'restaurantName', 'borough', 'cuisine'].indexOf(a)) < 0) return res.sendStatus(404) 
                if (a == "name") { a = "restaurantName"}
		var serach = {
                    [a]: b
                }
		

		global.r.find(serach).toArray(function(err,data){

                    	res.send(data)
			console.log(JSON.stringify(data));
			//res.status(200).json(data);
						console.log(a);
		})
	})
	app.get("/restaurant/new", function(req,res) {
		
		res.render('new')
	})
	app.post("/restaurant/new", function(req,res) {
		
		res.render('new')	
	})

       app.get('/logout', function (req, res) {
		global.userSession.delete(req.session.username)
		res.clearCookie("session")
		res.clearCookie("session.sig")
		res.redirect('/')
    	})

	 

	app.post('/', function (req, res) {
		console.log('Username:'+req.body.username);
		console.log('Password:'+req.body.password);
		let username = req.body.username
		let password = req.body.password
		global.user.find({
		    userid: username
		}).toArray(function (err, Result) {
		    try {
			
			

		        if (Result.length <= 0) throw ('UserID is Wrong')
		        if (Result[0].pw != password) throw ('Password is Wrong')
		        req.session.username = username
			global.userNow = username
		        global.userSession.add(username)
			res.redirect('/restaurant')
		        //res.send({status: 'login success'});
			console.log('Hello,'+req.body.username);

		    } catch (err) {
			console.log(err);
		        res.send('<script>alert("Login Fail '+err+'");window.history.back()</script>')

		    }
        })

    })


	app.post('/restaurant/rate/:id', function (req, res) { 
		var id = req.params.id
		var rate = req.body.rate
		
		global.r.update({_id: new ObjectID(id)},{$push:{grades: {$each:[req.session.username, rate ]} }}).then(function () {
                res.redirect('/display?_id=' + id)
		res.send('<script>alert("Finish");window.history.back()</script>')
            })
	})

	app.get("/restaurant/edit/:id", function(req,res) {
		var id = req.params.id
		global.r.findOne({_id: new ObjectID(id)}, function(err, result) {

		    console.log(result.restaurantName);
		    res.render('new2',{r:result,username:req.session.username})
		  });

	})

	app.post("/restaurant/edit/:id", function(req,res) {

	 if (req.files.filetoupload) {
		var file = req.files.filetoupload,
	
		   filename = file.name;
			mimetype = file.mimetype;
	 if (!(typeof filename === 'undefined')){
		file.mv("./"+filename,function(err){
			if(err){
				console.log(err)
				res.send("error")
			} else {
			   console.log("Done!")
			}
		})}
	 }

		var id = req.params.id
		var rtname = (req.body.rtname.length > 0) ? req.body.rtname : "";
		var borough = (req.body.borough.length > 0) ? req.body.borough : "";
		var cuisine = (req.body.cuisine.length > 0) ? req.body.cuisine : "";

		var photo = filename;
	 	var mimetype = mimetype;

		var street = (req.body.street.length > 0) ? req.body.street : "";
		var building = (req.body.building.length > 0) ? req.body.building : "";
		var zipcode = (req.body.zipcode.length > 0) ? req.body.zipcode : "";
		var lat = (req.body.lat.length > 0) ? req.body.lat : "22.316151";
		var lon = (req.body.lon.length > 0) ? req.body.lon : "114.180340";
		
		var exif = {};
		  var image = {};
		  image['image'] = filename;

		  try {
		    new ExifImage(image, function(error, exifData) {
		      if (error) {
			console.log('ExifImage: ' + error.message);
		      }
		      else {
			exif['image'] = exifData.image;
			exif['exif'] = exifData.exif;
			exif['gps'] = exifData.gps;
			console.log('Exif: ' + JSON.stringify(exif));
		      }
		    })
		  } catch (error) {}

		var form = {};
		var form2 = {};
		form['address'] = form2;
			form2['street'] = street;
			form2['zipcode'] = zipcode;
			form2['building'] = building;
			form2['coord'] = [lat,lon];
		form['borough']= borough;
		form['cuisine']= cuisine;
		form['restaurantName']= rtname;
	
		if (typeof filename === 'undefined') {
				

		global.r.update({_id: new ObjectID(id)},{$set:form}).then(function () {
		        	global.r.findOne({_id: new ObjectID(id)}, function(err, result) {
				
		
			    
					    console.log('no image upload' +result.restaurantName);
					    res.render('new2',{r:result,username:req.session.username})
				})

		res.send('<script>alert("Finish");window.history.back()</script>')
		   }) 
		} else { 	
			fs.readFile(filename, function(err,data) {
				
				
				form['mimetype'] = mimetype;
				form['image'] = new Buffer(data).toString('base64');
				form['exif'] = exif;

		global.r.update({_id: new ObjectID(id)},{$set:form}).then(function () {
		        	global.r.findOne({_id: new ObjectID(id)}, function(err, result) {
				
		
			    
					    console.log('image upload'+result.restaurantName);
					    res.render('new2',{r:result,username:req.session.username})
				})

		res.send('<script>alert("Finish(image)");window.history.back()</script>')
		   }) 
		})  //readFile
	      } //else
	})














})

	app.post('/restaurant/delete/:id', function (req, res) { 
			var id = req.params.id
		
			 global.r.deleteOne({_id: new ObjectID(id)}, function(err, obj) {
			    if (err) throw err;
                	  res.redirect('/restaurant')
			  })



	
  
	

})

app.post('/api/restaurant/create', function (req, res) {
	    new Promise(function (resolve, reject) {
		        add(req, resolve, reject)
		    }).then((data) => {
		        res.send({
		            status: 'ok',
		            _id: data.insertedIds[0]
		        })
		    }).catch(function (err) {
		        res.send({
		            status: 'failed'
		        })
		    })
		
		
	})
function add(req, resolve, reject) {
      let formData = getData(req)
        formData['grades'] = []
        new Promise(function (resolve, reject) {
            global.r.find({
                restaurantName: formData.restaurantName
            }).limit(1).toArray((err, data) => {
                resolve(data)
            })
        }).then(function (data) {
            if (data.length > 0) return reject('Holy reject')
            return global.r.count()
        }).then(function (count) {
            formData['restaurant_id'] = count + 1
            return global.r.insert(formData)
        }).then(function (savedRestaurant) {
            resolve(savedRestaurant)
        })
    }

function getData(req) {

        const restaurantName = req.body.name;
        const cuisine = req.body.cuisine || "null";
        const borough = req.body.borough || "null";
        const street = req.body.street || "null";
        const building = req.body.building || "null";
        const zipcode = req.body.zipcode || "null";
        const lat = req.body.latitude || "22.316151";
        const lon = req.body.longtitude || "114.180340";
	const exif = {};
	const image = 	"null";
      	const mimetype = "null";
        const userid = req.session.username || req.body.owner || req.body.username || req.body.userid || req.body.user;
        const err = ' Not defined'
	
	
        assert.notEqual(restaurantName, undefined, 'name' + err)
        assert.notEqual(userid, undefined, 'owner' + err)

        let add = {
            address: {
		street,
		zipcode,
		building,
		coord: [
		    lat,
		    lon
		]
	    },
	    borough,
	    cuisine,
	    restaurantName,
	    userid,
	    exif,
	    image,
	    mimetype
	}
        
        return add
    }


/*app.post('/test', function(req, res) {
    console.log(req.body.name);
    console.log(req.body.password);
});
*/

app.listen(process.env.PORT || 8099);
