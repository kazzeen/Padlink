import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin";
  const password = "admin!23";
  const name = "Admin User";
  const role = "ADMIN";

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        role: role 
      },
    });
    console.log("Admin user updated with new password.");
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });
    console.log(`Admin user created with id: ${user.id}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
