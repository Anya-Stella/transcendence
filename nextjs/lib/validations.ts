import { z } from "zod";

export const signupSchema = z.object({
	email: z
		.string()
		.email("有効なメールアドレスを入力してください"),
	password: z
		.string()
		.min(8, "パスワードは8文字以上にしてください"),
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(50, "名前は50文字以内にしてください"),
});

export const loginSchema = z.object({
	email: z
		.string()
		.email("有効なメールアドレスを入力してください"),
	password: z
		.string()
		.min(1, "パスワードを入力してください"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
