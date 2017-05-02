// Run me using "node app.js"

////////////////////////////////////////////////////////////////////////////////
// SERVERSIDE SETUP

const express = require('express')
const oauthSignature =  require('oauth-signature')
const app = express()
const https = require('https')
const fs = require('fs')
const port = 3000
const path = require('path')

var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

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
function isNonceValid(nonce){
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

// GET request functionality, need to return the viewer page and applicable
// parameters? Maybe the post needs to return the page.
app.get('/', function(req, res){
  res.send('Hello World!')
});

// POST request functionality, parses the POST params, authorizes, and launches.
app.post('/', function(req, res){
  console.log('Got a post request!')

  // Parse all parameters that are useful
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

res.sendFile('viewer.html',{ root: path.join(__dirname, '../web') })

});

const httpsOptions = {
  key: fs.readFileSync('./.localhost-ssl/key.pem'),
  cert: fs.readFileSync('./.localhost-ssl/cert.pem')
}

const server = https.createServer(httpsOptions, app).listen(port, function(){
  console.log('server running at ' + port)
});
