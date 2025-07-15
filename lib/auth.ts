import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserRole } from './enums/roles.enum';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Mock authentication - replace with actual API call
        const mockUsers = [
          {
            id: '1',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            name: 'Admin User',
          },
          {
            id: '2',
            email: 'driver@example.com',
            password: 'driver123',
            role: UserRole.DRIVER,
            name: 'Driver User',
          },
          {
            id: '3',
            email: 'establishment@example.com',
            password: 'establishment123',
            role: 'establishment',
            name: 'Establishment User',
          },
        ];

        const user = mockUsers.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
