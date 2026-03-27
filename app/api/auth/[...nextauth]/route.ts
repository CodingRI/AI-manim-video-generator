import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials";

import {PrismaAdapter} from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            email: {},
            password : {}
          },

          async authorize (credentials) {
            if(!credentials?.email || !credentials?.password) {
              throw new Error("Missing credential");
            }
            const user = await prisma.user.findUnique({
              where : {email : credentials.email}
            })
            if(!user || !user.password){
              throw new Error("User not found")
            }
            const isValid = await bcrypt.compare(
              credentials.password,
              user.password
            )

            if(!isValid){
              throw new Error("Invalid password")
            }
            return user;
          }
        })
    ],

    session: {
      strategy: "jwt"
    },
    pages :{
      signIn: "/auth"
    },
    callbacks : {
      async session({session, token}) {
        if(session.user) {
          session.user.id = token.sub!
        }
        return session;
      }
    }
})

export {handler as GET, handler as POST};