import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getOTP, incrementAttempts, deleteOTP } from "@/lib/otpHandler/otp";

export async function POST(req: Request) {
  const { email, password, name, otp } = await req.json();

  const storedOTP = await getOTP(email);

  if (!storedOTP) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  // check attempts
  const attempts = await incrementAttempts(email);
  if (attempts > 5) {
    await deleteOTP(email);
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

  return NextResponse.json({ success: true });
}