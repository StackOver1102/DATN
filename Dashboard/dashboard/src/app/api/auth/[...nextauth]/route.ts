import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Replace this with your actual API call to authenticate
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          console.log(data);
          if (response.ok && data.data && data.data.user) {
            return {
              id: data.data.user._id,
              email: data.data.user.email,
              name: data.data.user.fullName,
              role: data.data.user.role,
              token: data.data.access_token,
            };
          }
          
          return null;
        } catch  {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback - user:", user);
      console.log("JWT callback - token before:", token);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.token = user.token;
      }
      console.log("JWT callback - token after:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token:", token);
      console.log("Session callback - session before:", session);
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.token = token.token;
      }
      console.log("Session callback - session after:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  // Updated for port 4000
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };