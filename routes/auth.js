const express = require("express");
const router = express.Router();


const {userRegisterValidator, userLoginValidator, forgotPasswordValidator, resetPasswordValidator} = require("../validators/auth")
const {runValidation} = require("../validators")

const {register, registerActivate, login, forgotPassword, resetPassword} = require("../controllers/auth");


router.post("/register", userRegisterValidator, runValidation, register);
router.post("/register/activate", registerActivate);
router.post("/login", userLoginValidator, runValidation, login);
router.put("/forgot-password", forgotPasswordValidator, runValidation, forgotPassword);
router.put("/reset-password", resetPasswordValidator, runValidation, resetPassword);


module.exports = router;