const prisma = require("../config/prisma");

const createRental = async(rentalData)=>{
    return await prisma.$transaction(async(tx) =>{
        const customer = await tx.customer.findUnique({
            where:{
                id: rentalData.customerId
            }
        });
        if(!customer){
            throw new Error("customer not found")
        }

        const material = await tx.material.findUnique({
            where:{
                id: rentalData.materialId
            }
        })

        if (!material || !material.isActive) {
         throw new Error("Active material not found");
        }

        if (rentalData.quantity > material.availableUnits) {
            throw new Error("Requested quantity is not available");
        }

        const startDate = new Date(rentalData.startDate);
        if (Number.isNaN(startDate.getTime())) {
            throw new Error("Invalid issue date");
        }


        const dailyRentalRate = Number(material.dailyRentalRate)

        const rental = await tx.rental.create({
            data:{
                customerId : rentalData.customerId,
                materialId : rentalData.materialId,
                quantity : rentalData.quantity,
                startDate : startDate,
                endDate : null,
                dailyRentalRate : dailyRentalRate,
                totalAmount : null,
                notes: rentalData.notes || null
            },
            include:{
                customer: true,
                material: true
            }
        })

        await tx.material.update({
            where:{
                id: rentalData.materialId
            },
            data :{
                availableUnits :{
                    decrement: rentalData.quantity
                }
            }
        })

        return rental
    })
}

const getAllRentals = async(page=1, limit=10, search="", status="")=>{

    const skip = (page-1) * limit
    const where = {
        ...(status ? {status} : {}),
        ...(search ? {
            OR:[
                {
                    customer:{
                        name:{
                            contains:search,
                            mode: "insensitive"
                        }
                    },
                    material:{
                        name:{
                            contains:search,
                            mode: "insensitive"
                        }

                    }
                }
            ]
        }: {})
    };

    const [rentals, totalRentals] = await Promise.all([
        prisma.rental.findMany({
            where,
            skip,
            take:limit,
            orderBy:{
                createdAt: "desc"
            },
            include:{
                customer:true,
                material:true
            }
        }),
        prisma.rental.count({
            where
        })
    ]);
    return {
        rentals,
        totalRentals,
        totalPages: Math.ceil(totalRentals/limit),
        currentPage: page

    }

}

module.exports = {
    createRental,
    getAllRentals
}