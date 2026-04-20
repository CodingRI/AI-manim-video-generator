import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getOTP, incrementAttempts, deleteOTP, getSignupData, deleteSignupData  } from "@/lib/otpHandler/otp";


export async function POST(req: Request) {
  const { email, otp } = await req.json();
  const cleanEmail = email.trim().toLowerCase().replace(/[^\w@.\-+]/g, "");
  const signupData = await getSignupData(cleanEmail);

if (!signupData) {
  return NextResponse.json({ error: "Signup expired" }, { status: 400 });
}

const { name, password } = signupData;
  const storedOTP = await getOTP(cleanEmail);

  if (!storedOTP) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  // check attempts
  const attempts = await incrementAttempts(cleanEmail);
  if (attempts > 5) {
    await deleteOTP(cleanEmail);
    return NextResponse.json({ error: "Too many attempts" }, { status: 400 });
  }

  if (storedOTP !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  await deleteOTP(email);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });


  await deleteSignupData(cleanEmail);

  return NextResponse.json({ success: true,
  email: cleanEmail,
  password: signupData.password, });


}