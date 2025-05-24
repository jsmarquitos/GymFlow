import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'instructor' | 'member';
  name: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<UserProfile | null> {
        if (!credentials) {
          return null;
        }
        const { email, password } = credentials;
        let connection;
        try {
          connection = await pool.getConnection();
          const [rows] = await connection.execute<RowDataPacket[]>(
            'SELECT id, email, password_hash, role, first_name, last_name FROM Users WHERE email = ?',
            [email]
          );

          if (rows.length > 0) {
            const user = rows[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (isValidPassword) {
              return {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.first_name} ${user.last_name}`.trim(),
              };
            }
          }
          return null;
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        } finally {
          if (connection) {
            connection.release();
          }
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as UserProfile;
        token.userId = u.id;
        token.role = u.role;
        token.email = u.email;
        token.name = u.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as 'admin' | 'instructor' | 'member';
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
