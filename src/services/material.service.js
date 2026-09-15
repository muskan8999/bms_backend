const prisma = require("../config/prisma")

const createMaterial = async(materialData)=>{
    const material = await prisma.material.create({
        data: materialData
    })
    return material;
}

const getAllMaterials = async({page=1, limit = 10, search = ""})=>{
    const skip = (page-1 ) * limit
    const where = search ? {
        OR:[
            {name:{
                contains:search,
                mode: "insensitive"
            }}
        ]
    } : {}

    const [materials, totalMaterials] = await Promise.all([
        prisma.material.findMany({
            where,
            skip,
            take:limit,
            orderBy:{
                createdAt: "desc"
            }
        }),
        prisma.material.count({
            where,
        })
    ])

    return {
        materials,
        totalMaterials,
        totalPages: Math.ceil(totalMaterials/limit),
        currentPage: page
    }

}

const updateMaterial = async(materialId, materialData)=>{
    const material = await prisma.material.update({
        where:{
            id:materialId
        },
        data: materialData
    })

    return material;
}
const getMaterialById = async (id) => {
  const material = await prisma.material.findUnique({
    where: {
      id,
    },
  });

  return material;
};

const deleteMaterial = async(materialId)=>{
    const material = await prisma.material.update({
        where:{
            id:materialId
        },
        data:{
            isActive: false
        }
    })
    return material
}

const activateMaterial = async(materialId)=>{
    const material = await prisma.material.update({
        where:{
            id:materialId
        },
        data:{
            isActive: true
        }
    })
    return material
}
module.exports = {
    createMaterial,
    getAllMaterials,
    updateMaterial,
    getMaterialById,
    deleteMaterial,
    activateMaterial
}