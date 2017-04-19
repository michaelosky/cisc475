var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

// load the user model
var User = require('../models/user');
var config = require('./database'); // get db config file

module.exports = function(passport) {
  var options = {};
  options.secretOrKey = config.secret;
  options.jwtFromRequest = ExtractJwt.fromAuthHeader();
  passport.use(new JwtStrategy(options, function(payload, done) {
    User.findOne({id: payload.id}, function(err, user) {
      if(err) {
        done(err, false);
      } else if(user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }));
};