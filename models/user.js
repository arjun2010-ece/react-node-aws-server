const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        trim: true,
        required: true,
        max: 12,
        unique: true,
        index: true,
        lowercase: true
    },
    name: {
        type: String,
        trim: true,
        required: true,
        max: 32
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        lowercase: true
    },
    hashed_password: {
        type: String,
    },
    role: {
        type: String,
        default: "subscriber"
    },
    resetPasswordLink: {
        data: String,
        default: ""
    },
    categories: [
        {
            type: ObjectId,
            ref: 'Category',
            required: true
        }
    ]
}, {timestamps: true});

userSchema.virtual("password")
    .set(function(pwd){
        this.hashed_password = this.encryptPassword(pwd);
    })


userSchema.methods = {
    authenticate: function(plainPwd){
        return bcrypt.compareSync(plainPwd, this.hashed_password);
    },
    encryptPassword : function(plainPassword){
        if(!plainPassword) return "";

        try {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(plainPassword, salt);
            return hash;
        } catch (error) {
            return "";
        }
    }
}

module.exports = mongoose.model("User", userSchema);