const User = require('../models/user');
const Link = require('../models/link');

// finding user and then finding links by that user
// it will be in users controllers
//but response should be both user and links
exports.read = (req, res) => {
    // bcoz of requireSignIn middleware, we can access req.user._id.
    User.findOne({ _id: req.user._id }).exec((err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        Link.find({ postedBy: user })
            .populate('categories', 'name slug')
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 })
            .exec((err, links) => {
                if (err) {
                    return res.status(400).json({
                        error: 'Could not find links'
                    });
                }
                user.hashed_password = undefined;
                // user.salt = undefined;
                res.json({ user, links });
            });
    });
};


exports.update = (req, res) => {
    const { name, password, categories} = req.body;

    switch(true){
        case password && password.length < 6 :
            return res.status(400).json({
                error: "Password must be atleast 6 characters long"
            });
    }

    User.findOneAndUpdate({_id: req.user._id}, {name, password, categories}, {new: true})
        .exec((err, updated) => {
            if(err){
                return res.status(400).json({
                    error: "Could not find user to update."
                })
            }
            updated.hashed_password = undefined;
            res.json(updated);
        })
}