const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let UserSchema = mongoose.Schema({
    password: {
        type: String
    },
    email: {
        type: String,
        unique : true
    },
    name: {
        type: String
    },
    token: {
        type: String
    },
    authorized: {
        type: Boolean
    }
})

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            // Store hash in your password DB.
            newUser.password = hash;
            newUser.save(callback)
        });
    });
}

module.exports.getUserByEmail = function(email, callback) {
    let query = {email: email};
    User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback) {
    User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err,isMatch) {
        if(err) throw err;
        callback(null,isMatch);
    })
}



