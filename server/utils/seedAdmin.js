  import UserModel from "../models/user.model.js";

export const seedAdminUser = async () => {
  try {
    const userCount = await UserModel.countDocuments();
    
    if (userCount === 0) {
      const hashedPassword = await UserModel.hashPassword("test@123");
      
      await UserModel.create({
        name: "Admin",
        businessName: "Admin System",
        email: "adminbill@gmail.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
        IsVerified: true,
      });
      console.log("Default admin created");
    } else {
      console.log("Users already exist, skipping admin seed");
    }
  } catch (error) {
    console.error("Error seeding default admin:", error.message);
  }
};
