import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import authConfig from "./auth.config";


export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	debug: process.env.NODE_ENV !== "production",
	...authConfig,
	callbacks: {
		// 1. 通行証の手帳（JWTトークン）を作る・更新する処理
		async jwt({ token, user, trigger, session }) {
			// 初回のログイン時：DBの user 情報を元にトークンに名前とIDをメモする
			if (user) {
				token.id = user.id as string; // prisma id              String   @id @default(uuid())
				token.name = user.name;
				token.picture = user.image;
			}
			// クライアント（画面）から update() が呼ばれた時（trigger === "update"）
			// 送られてきた sessionオブジェクト（今回は { name: "新しい名前" }）で、手帳の文字を上書きする
			if (trigger === "update" && session) {
				if(session.name)
					token.name = session.name;
				if(session.image)
					token.picture = session.image;
			}
			return token;
		},
		// 2. 画面（useSession）に渡す「最終的な通行証（セッション）」の形を決める処理
		async session({ session, token }) {
			if (session.user && token) {
				// 更新されたトークンの中に書かれている ID や 名前 や画像 を、画面用のセッションにコピーして渡す
				session.user.id = token.id as string;
				session.user.name = token.name as string;
				session.user.image = token.picture as string;
			}
			return session;
		},
	},
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const user = await prisma.user.findUnique({
					where: { email: credentials.email as string },
				});

				if (!user || !user.passwordHash) return null;

				const isValid = await argon2.verify(user.passwordHash, credentials.password as string);

				if (!isValid) return null;

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				};
			},
		}),
	],
});