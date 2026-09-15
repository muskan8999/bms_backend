const prisma = require("../config/prisma");
const materialService = require("../services/material.service");
const createMaterial = async (req, res) => {
  try {
    const { name, totalUnits, dailyRentalRate, description } = req.body;
    if (!name || dailyRentalRate === undefined || dailyRentalRate === null) {
      return res.status(400).json({
        success: false,
        message: "Name and daily rental rate are required",
      });
    }
    const totalUnitsNumber =
      totalUnits === undefined || totalUnits === null || totalUnits === ""
        ? 0
        : Number(totalUnits);

    if (!Number.isInteger(totalUnitsNumber) || totalUnitsNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Total units must be a valid non-negative integer",
      });
    }
    const dailyRentalRateNumber = Number(dailyRentalRate);

    if (!Number.isFinite(dailyRentalRateNumber) || dailyRentalRateNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Daily rental rate must be a valid non-negative number",
      });
    }

    const material = await materialService.createMaterial({
      name: name.trim(),
      totalUnits: totalUnitsNumber,
      availableUnits: totalUnitsNumber,
      dailyRentalRate: dailyRentalRateNumber,
      description: description?.trim() || null,
    });
    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      material,
    });
  } catch (error) {
    console.log("create material error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const getAllMaterials = async(req, res)=>{
    try{
        const {page, limit, search} = req.query
        const limitNumber = Number(limit) || 10;
    const pageNumber = Number(page) || 1;
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit",
      });
    }
        const materialData = await materialService.getAllMaterials({
            page:pageNumber,
            limit:limitNumber,
            search: search || ""
        })

        return res.status(200).json({
            success: true,
            message: "Materials fetched successfully",
            materialData
        })

    }catch(error){
        console.log("get all materials error", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name, totalUnits,dailyRentalRate, description,} = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }
    const materialName = name?.trim();

    if (!materialName || dailyRentalRate === undefined ||dailyRentalRate === null) {
      return res.status(400).json({
        success: false,
        message: "Name and daily rental rate are required",
      });
    }

    const totalUnitsNumber =totalUnits === undefined || totalUnits === null || totalUnits === ""
        ? 0
        : Number(totalUnits);

    if (!Number.isInteger(totalUnitsNumber) || totalUnitsNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Total units must be a valid non-negative integer",
      });
    }

    const dailyRentalRateNumber = Number(dailyRentalRate);

    if ( !Number.isFinite(dailyRentalRateNumber) || dailyRentalRateNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Daily rental rate must be a valid non-negative number",
      });
    }

    const existingMaterial =await materialService.getMaterialById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const unitsDifference = totalUnitsNumber - existingMaterial.totalUnits;
     const newAvailableUnits = existingMaterial.availableUnits + unitsDifference;

    if (newAvailableUnits < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Total units cannot be less than currently rented units",
      });
    }

    const material = await materialService.updateMaterial(id, {
      name: materialName,
      totalUnits: totalUnitsNumber,
      availableUnits: newAvailableUnits,
      dailyRentalRate: dailyRentalRateNumber,
      description: description?.trim() || null,
    });

    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      material,
    });
  } catch (error) {
    console.log("update material error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMaterialById = async(req, res)=>{
    try{
        const {id} = req.params;
        const material = await materialService.getMaterialById(id);
        if(!material){
            return res.status(404).json({
                success: false,
                message: "Material not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Material fetched successfully",
            material
        })

    }catch(error){
        console.log("get material by id error", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const deleteMaterial = async(req,res)=>{
    try{
        const {id} = req.params;
        if (!id) {
        return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }

    const existingMaterial = await materialService.getMaterialById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }
    if(!existingMaterial.isActive){
        return res.status(400).json({
            success: false,
            message: "Material is already deleted"
        })
    }
    const deletedMaterial = await materialService.deleteMaterial(id);
        return res.status(200).json({
            success: true,
            message: "Material deleted successfully",
            deletedMaterial
        })

        
    }catch(error){
        console.log("errro while deleting material", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const activateMaterial = async(req,res)=>{
    try{
        const {id} = req.params;
        if (!id) {
        return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }

    const existingMaterial = await materialService.getMaterialById(id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }
    if(existingMaterial.isActive){
        return res.status(400).json({
            success: false,
            message: "Material is already activated"
        })
    }
    const deletedMaterial = await materialService.activateMaterial(id);
        return res.status(200).json({
            success: true,
            message: "Material activate successfully",
            deletedMaterial
        })

        
    }catch(error){
        console.log("errro while activate material", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

module.exports = {
    createMaterial,
    getAllMaterials,
    updateMaterial,
    getMaterialById,
    deleteMaterial,
    activateMaterial
}
