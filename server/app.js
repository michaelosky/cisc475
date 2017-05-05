// Run me using "node app.js"

////////////////////////////////////////////////////////////////////////////////
// SERVERSIDE SETUP

const express = require('express')
const oauthSignature = require('oauth-signature')
const https = require('https')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const bodyParser = require('body-parser')
const multiparty = require('multiparty');

const app = express()
const port = 3000

app.set('port', port);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../web'));

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));
app.use(express.static(__dirname + '/../web'));

////////////////////////////////////////////////////////////////////////////////
// NONCE HISTORY MANAGEMENT
// Note: This is a pretty crude way of doing this, but it gets the job done.

// How many nonces we want to store
var nonce_list_size = 50;

// The actually in-memory storage of the nonces
var nonce_list = new Array(nonce_list_size);

// The current index to insert at
var nonce_list_index = 0;

// Checks to see if a nonce is valid
function isNonceValid(nonce) {
  // If the nonce is not defined or blank, it's not valid.
  if (nonce === "undefined" || nonce === "") {
    return false;
  }

  // Check the nonce history, if this nonce is a duplicate, it's not valid.
  for (var i = 0; i < nonce_list_size; i++) {
    if (nonce_list[i] === nonce) {
      console.log("Nonce " + nonce + " has been used too recently.")
      return false;
    }
  }

  // Otherwise this is a valid nonce, update the history
  nonce_list[nonce_list_index] = nonce;

  // Increment the placement position, and if we're at max, roll over to 0
  nonce_list_index = nonce_list_index == nonce_list_size - 1 ? 0 : nonce_list_index++;
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// HTTP REQUEST BEHAVIOR

// GET request functionality, this is what is called on a redirect to '/'
app.get('/', function(req, res) {

  // Check the query string to see if data has been passed in.
  var uploadPermissions = req.query.upload;
  var person_name_full = req.query.user;

  // If we have a name, get rid of the dash from the query string.
  if (person_name_full != undefined) {
    person_name_full = person_name_full.split("-").join(" ");
  }

  // These params are spoofed on get if there's no data.
  person_name_full = (person_name_full === undefined || uploadPermissions == "undefined") ? "John Smith" : person_name_full;
  uploadPermissions = (uploadPermissions === undefined || uploadPermissions == "undefined") ? "false" : uploadPermissions;

  // Render the viewer with the parameters.
  res.render('viewer', {
    'name': person_name_full,
    'can_upload': uploadPermissions
  });
});

// POST request functionality, parses the POST params, authorizes, and launches.
app.post('/', function(req, res) {
  console.log('Got a post request!')

  // Parse all parameters that might be useful
  var url = req.url
  var type = req.body.lti_message_type;
  var version = req.body.lti_version;
  var resource_link_id = req.body.resource_link_id;
  var context_id = req.body.context_id;
  var user_id = req.body.user_id;
  var custom_canvas_user_id = req.body.custom_canvas_user_id;
  var roles = req.body.roles;
  var oauth_key = "0123456789abcdef"; // from the canvas tutorial, needs to eventually change
  var oauth_nonce = req.body.oauth_nonce;
  var oauth_timestamp = req.body.oauth_timestamp;
  var oauth_signature = req.body.oauth_signature;
  var person_name_full = req.body.lis_person_name_full;
  var person_contact_email_primary = req.body.lis_person_contact_email_primary;
  var person_name_given = req.body.lis_person_name_given;
  var person_name_family = req.body.lis_person_name_family;
  var custom_bacon = req.body.custom_bacon;
  var outcome_service_url = req.body.lis_outcome_service_url;
  var uploadPermissions = roles === "Instructor" || roles === "Admin";

  // Check if the nonce is valid
  if (!isNonceValid(oauth_nonce)) {
    res.send("error occured, no OAuth nonce. Please contact your system admin.")
    return;
  }

  // Check if the timestamp is valid
  var currentTimestamp = Math.round((new Date()).getTime() / 1000);
  if (Math.abs(currentTimestamp - oauth_timestamp) > 120000) {
    res.send("error occured, bad OAuth timestamp. Please contact your system admin.")
    return;
  }

  // WILL - OAuth signaure verification should go here.
  // If everything is valid, send back a page that echoes the params.
  //   res.send(
  //   "<p>Post Type: " + type + "</p>" +
  //   "<p>Version: " + version + "</p>" +
  //   "<p>Resource Link ID: " + resource_link_id + "</p>" +
  //   "<p>Context ID: " + context_id + "</p>" +
  //   "<p>User ID: " + user_id + "</p>" +
  //   "<p>Canvas User ID: " + custom_canvas_user_id + "</p>" +
  //   "<p>Roles: " + roles + "</p>" +
  //   "<p></p>" +
  //   "<p>OAuth Key: " + oauth_key + "</p>" +
  //   "<p>OAuth Nonce: " + oauth_nonce + "</p>" +
  //   "<p>OAuth Timestamp: " + oauth_timestamp + "</p>" +
  //   "<p>OAuth Signature: " + oauth_signature + "</p>" +
  //   "<p></p>" +
  //   "<p>Person Name Full: " + person_name_full + "</p>" +
  //   "<p>Person Contact Email Primary: " + person_contact_email_primary + "</p>" +
  //   "<p>Person Name Given: " + person_name_given + "</p>" +
  //   "<p>Person Name Family : " + person_name_family + "</p>"+
  //   "<p></p>" +
  //   "<p>custom_bacon: " + custom_bacon + "</p>" +
  //   "<p></p>" +
  //   "<p>outcome_service_url: " + outcome_service_url + "</p>"
  // );

  // Render the viewer with the parameters.
  res.render('viewer', {
    'name': person_name_full,
    'can_upload': uploadPermissions
  });



});

// POST UPLOAD endpoint
app.post('/upload', function(req, res) {
  console.log("Upload started.");

  // NOTE: Multer has to come before multiparty, I think this is because
  // multiparty actually modifies the data, making it impossible for multer to
  // parse it how it wants.

  // Start multer upload block
  var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, '../uploads');
    },
    filename: function(req, file, callback) {
      callback(null, file.originalname)
    }
  });
  var upload = multer({ storage: storage }).single('pdf');
  upload(req, res, function(err) {
    if (err) {
      console.log('Error Occured');
      return;
    }
  });
  // End multer upload block

  // Parse multipart form data using multiparty
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {

    // Get the fields we care about.
    var customFileName = fields['customFileName'].toString();
    var canUpload = fields['canUpload'].toString();
    var user = fields['user'].toString().split(" ").join("-");

    // Redirect to GET '/'
    res.redirect('/?user=' + user + "&upload=" + canUpload);
    console.log('PDF Uploaded');
  });
});

////////////////////////////////////////////////////////////////////////////////
// ACTUALLY RUNNING THE SERVER

const httpsOptions = {
  key: fs.readFileSync('./.localhost-ssl/key.pem'),
  cert: fs.readFileSync('./.localhost-ssl/cert.pem')
}

const server = https.createServer(httpsOptions, app).listen(port, function() {
  console.log('server running at ' + port)
});
