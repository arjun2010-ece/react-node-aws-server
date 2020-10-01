const express = require("express");
const router = express.Router();


const {read, update} = require("../controllers/user");
const {requireSignin, authMiddleware, adminMiddleware} = require("../controllers/auth");


const {runValidation} = require("../validators");
const { userUpdateValidator } = require("../validators/auth");

router.get("/user", requireSignin, authMiddleware, read);
router.get("/admin", requireSignin, adminMiddleware, read);
router.put("/user", userUpdateValidator, runValidation, requireSignin, authMiddleware, update);


module.exports = router;