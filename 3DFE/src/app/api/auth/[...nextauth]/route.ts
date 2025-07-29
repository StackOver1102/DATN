import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { ApiResponse, LoginResponse } from "@/lib/types";

// Extend NextAuth types via declaration merging
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      balance?: number | null;
    }
  }
  
  interface User {
    id: string;
    email: string;
    token?: string;
    balance?: number;
    fullName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    balance?: number;
    fullName?: string;
    email?: string;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Get the API URL from environment variables or use a default
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

          // Call the NestJS backend API directly
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          // Get the response data
          const nestResponse: ApiResponse<LoginResponse> = await response.json();
          console.log("nestResponse", nestResponse);
          // If the response is not successful, return null (authentication failed)
          if (!response.ok) {
            console.error("Authentication failed:", nestResponse.message || "Authentication failed");
            return null;
          }

          // Return the user object with the token
          return {
            id: nestResponse.data.user?._id,
            name: nestResponse.data.user?.fullName,
            email: nestResponse.data.user?.email,
            balance: nestResponse.data.user?.balance || 0,
            token: nestResponse.data.access_token
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Pass the token from the user to the JWT
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.fullName = user.name || '';
        token.email = user.email;
        token.balance = user.balance;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.fullName,
          email: token.email,
          balance: token.balance,
        };
        // Add the access token to the session
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
