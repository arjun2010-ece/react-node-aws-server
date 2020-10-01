const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const shortid = require("shortid");
const expressJwt = require('express-jwt');
const _ = require("lodash");

const {registerEmailParams, resetPasswordParams} =require("../helpers/email");

//Giving administrator access to users can have access of all the services
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});
            // .sendEmail(params).promise();

exports.register =  (req, res) => {
    const {name, email, password, categories} = req.body;
    //check if user already exists in DB
    User.findOne({email}).exec((err, user) => {
        if(err || user){
            return res.status(400).json({
                error: "Email is taken"
            })
        }

        //Generate token with user name email and password
        const token = jwt.sign({name, email, password, categories}, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: "10m"} );
        //params
        const params = registerEmailParams(email, token);
        const sendEmailOnRegister = ses.sendEmail(params).promise();
        sendEmailOnRegister
            .then(data => {
                res.json({
                    message: `Email has been Sent to ${email}, Follow the instructions to complete your registration`
                });
            })
            .catch(err => {
                res.json({
                    error: `We could not verify your email. Please try again.`
                });
            });

    })

}


exports.registerActivate = (req, res) => {
    const {token} = req.body;

    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded){
        if(err){
            return res.status(401).json({
                error: "Expired Link. Try Again"
            })
        }

        const {name, email, password, categories} = jwt.decode(token);
        const username = shortid.generate();

        User.findOne({email}).exec((error, user)=>{
            if(user){
                return res.status(401).json({
                    error: "Email is taken."
                })
            }
            // register new user
            const newUser = new User({username, name, email, password, categories});
            newUser.save((err, result) =>{
                if(err){
                    return res.status(401).json({
                        error: "Error saving user in database. Try Later."
                    })
                }

                return res.json({
                    message: "Registration success. Please Login."
                })
            })
        })
    })
}


exports.login = (req, res) => {
    const {email, password} = req.body;

    User.findOne({email}).exec((err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: "User with that email does not exist. Please Register."
            })
        }

        // authenticate
        if(!user.authenticate(password)){
            return res.status(400).json({
                error: "Email and password do not match."
            })
        }

        //generate token, extract user details and send to client
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d"});
        const {_id, name, username, email, role} = user;
        return res.json({
            token, user:{_id, name, email, username, role}
        })
    })
}

// req.user
exports.requireSignin = expressJwt({  secret: process.env.JWT_SECRET, algorithms: ['HS256'] }); 

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id;
    User.findOne({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        // ADMIN can access these non-admin resources
        // if(user.role === "admin"){
        //     return res.status(400).json({
        //         error: 'User Resource. Access blocked for admin.'
        //     });
        // }
        req.profile = user;
        next();
    });
};
                        
exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id;
    User.findOne({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        // block other requests that is not admin.
        if (user.role !== 'admin') {
            return res.status(400).json({
                error: 'Admin resource. Access denied'
            });
        }

        req.profile = user;
        next();
    });
}

exports.forgotPassword = (req, res) => {
    const {email} = req.body;
    User.findOne({email}).exec((err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: 'User with that email does not exists.'
            });
        }

        const token = jwt.sign({name: user.name}, process.env.JWT_RESET_PASSWORD, {expiresIn: "10m"});
        const params = resetPasswordParams(email, token);

        // populate the user model > resetPasswordLink
        //updating a single user with updateOne
        return user.updateOne({resetPasswordLink: token}, (err, success) => {
            if(err || !user){
                return res.status(400).json({
                    error: 'User with that email does not exists.'
                });
            }

            const sendEmail = ses.sendEmail(params).promise();
            sendEmail
                .then(data => {
                    res.json({
                        message: `Email has been Sent to ${email}, Click on the link to reset your password`
                    });
                })
                .catch(err => {
                    res.json({
                        error: `We could not verify your email. Please try again.`
                    });
                });

        })
       
    })
}

exports.resetPassword = (req, res) => {
    const {resetPasswordLink, newPassword} = req.body;
    if(resetPasswordLink){

        // check for token expiry
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, success) => {
            if(err){
                return res.status(400).json({
                    error: 'Expired Link.Try Again'
                });
            }
            // anything else inside here.

            User.findOne({resetPasswordLink}).exec((err, user) => {
                if(err || !user){
                    return res.status(400).json({
                        error: 'Invalid token. Try Again'
                    });
                }
                
                //here we are assigning new password to "password"
                // on save(), it will bcom virtual and save into hashed_password field.
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ""
                }

                user = _.extend(user, updatedFields);
                user.save((err, result) => {
                    if(err){
                        return res.status(400).json({
                            error: 'Password reset failed. Try Again'
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password.`
                    })
                })
            })

        });


       
    }

}


exports.canUpdateDeleteLink = (req, res, next) => {
    const { id } = req.params;
    Link.findOne({ _id: id }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: 'Could not find link'
            });
        }
        let authorizedUser = data.postedBy._id.toString() === req.user._id.toString();
        if (!authorizedUser) {
            return res.status(400).json({
                error: 'You are not authorized'
            });
        }
        next();
    });
};