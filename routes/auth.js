var router = require('express').Router();
var mongoose = require('mongoose');
var User = require('../models/User.js');
var jwt = require('jwt-simple');
var config = require('../config/database')

router.post('/signup', function(req, res, next) {
  console.log(req.body)
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please provide a username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err, post) {
      if (err) {
        return next(err);
      }
      res.json(post);
    });
  }
});

router.post('/login', function(req, res, next) {
  console.log(req.body)
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) return next(err)

    if (!user) {
      res.send({success: false, msg: 'invalid username'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, user: user, token: 'JWT ' + token});
        } else {
          console.log(err);
          console.log(isMatch);
          res.send({success: false, msg: 'Authentication failed: incorrect password.'});
        }
      });
    }
  });
});

module.exports = router;
