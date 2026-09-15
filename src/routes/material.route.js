const express = require("express");
const {createMaterial, getAllMaterials, updateMaterial, getMaterialById, deleteMaterial, activateMaterial} = require("../controllers/material.controller")
const router = express.Router();

router.post("/create", createMaterial)
router.get("/getAll", getAllMaterials)
router.put("/update/:id", updateMaterial)
router.get("/:id", getMaterialById)
router.delete("/delete/:id", deleteMaterial)
router.put("/activate/:id", activateMaterial)

module.exports = router