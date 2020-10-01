const express = require("express");
const router = express.Router();


const {create, read, list, remove, update} = require("../controllers/category");
const {requireSignin, adminMiddleware} = require("../controllers/auth");

const { categoryCreateValidator, categoryUpdateValidator} = require("../validators/category");
const {runValidation} = require("../validators");


router.post("/category", categoryCreateValidator, runValidation, requireSignin, adminMiddleware, create);
router.get("/categories", list);
router.post("/category/:slug", read);
router.put("/category/:slug", categoryUpdateValidator, runValidation,requireSignin, adminMiddleware, update);
router.delete("/category/:slug", requireSignin, adminMiddleware, remove);


module.exports = router;