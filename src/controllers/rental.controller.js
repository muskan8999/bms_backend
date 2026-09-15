const rentalService = require("../services/rental.service");
const createRental = async(req, res)=>{
    try{

        const {customerId, materialId, quantity, startDate, endDate, notes} = req.body;

        if(!customerId || !materialId || !quantity || !startDate){
            return res.status(400).json({
                success: false,
                message: "customerId, materialId, quantity, startDate  are required"
            })
        }

        
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const rental = await rentalService.createRental({
        customerId,
        materialId,
        quantity,
        startDate,
        endDate :endDate || null,
        notes
    })


    return res.status(200).json({
        success: true,
        message: "Rental created successfully",
        rental
    })

    }catch(error){
        console.log("create rental error", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}
module.exports = {
    createRental
}