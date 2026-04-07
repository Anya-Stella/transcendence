import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ---- 型定義 ----

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
	include: {
	  requester: { select: { id: true; name: true; image: true; lastSeen:true ; wins: true ; losses: true} };
	  addressee: { select: { id: true; name: true; image: true; lastSeen:true ; wins: true ; losses: true} };
	};
  }>;
type FriendUser = {
  id: string;
  name: string | null;
  image: string | null;
  lastSeen: Date | null;
};
type FriendEntry = {
  friendshipId: string;
  user: FriendUser;
  createdAt: Date;
  wins: number;
  losses: number;
};
type FriendRequest = {
  friendshipId: string;
  user: FriendUser;
  createdAt: Date;
};


// フレンドとフレンド申請一覧の取得
export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	try {
		const userId = (session.user as { id?: string | null }).id;
		if (!userId) {
			return NextResponse.json({ error: "ユーザーIDが不明です" }, { status: 400 });
		}

		// 自分が関わっている Friendship をすべて取得
		const friendships = await prisma.friendship.findMany({
			where: {
				OR: [{ requesterUserId: userId }, { addresseeUserId: userId }],
			},
			include: {
				requester: {
					select: { id: true, name: true, image: true, lastSeen: true, wins: true , losses: true},
				},
				addressee: {
					select: { id: true, name: true, image: true, lastSeen: true, wins: true , losses: true},
				},
			},
		});

		// 整理して返す
		const friends: FriendEntry[] = [];
		const pendingRequests: FriendRequest[] = []; // 自分宛の承認待ち
		const sentRequests: FriendRequest[] = []; // 自分が送った承認待ち

		friendships.forEach((f : FriendshipWithUsers) => {
			const isRequester = f.requesterUserId === userId;
			const otherUser = isRequester ? f.addressee : f.requester;

			if (f.status === "accepted") {
				friends.push({
					friendshipId: f.id,
					user: otherUser,
					createdAt: f.createdAt,
					wins: otherUser.wins,
					losses: otherUser.losses,
				});
			} else if (f.status === "pending") {
				if (isRequester) {
					sentRequests.push({
						friendshipId: f.id,
						user: otherUser,
						createdAt: f.createdAt,
					});
				} else {
					pendingRequests.push({
						friendshipId: f.id,
						user: otherUser,
						createdAt: f.createdAt,
					});
				}
			}
		});

		return NextResponse.json({ friends, pendingRequests, sentRequests });
	} catch (error) {
		console.error("Error fetching friends:", error);
		return NextResponse.json({ error: "フレンド情報の取得に失敗しました" }, { status: 500 });
	}
}

// フレンド申請の送信
export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	try {
		const { targetUserId, targetEmail } = await req.json();
		const userId = session.user.id;
		if (!userId) {
			return NextResponse.json({ error: "ユーザーIDが不明です" }, { status: 400 });
		}

		let addresseeId = targetUserId;

		// emailで検索された場合
		if (!addresseeId && targetEmail) {
			const user = await prisma.user.findUnique({
				where: { email: targetEmail },
			});
			if (!user) {
				return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
			}
			addresseeId = user.id;
		}

		if (!addresseeId) {
			return NextResponse.json({ error: "ユーザーIDまたはメールアドレスを指定してください" }, { status: 400 });
		}

		if (userId === addresseeId) {
			return NextResponse.json({ error: "自分自身にフレンド申請はできません" }, { status: 400 });
		}

		// pairKey の生成
		const minId = userId < addresseeId ? userId : addresseeId;
		const maxId = userId > addresseeId ? userId : addresseeId;
		const pairKey = `${minId}:${maxId}`;

		// 既に申請またはフレンドか確認
		const existing = await prisma.friendship.findUnique({
			where: { pairKey },
		});

		if (existing) {
			return NextResponse.json({ error: "既にフレンド申請済み、もしくはフレンドです" }, { status: 400 });
		}

		const friendship = await prisma.friendship.create({
			data: {
				requesterUserId: userId,
				addresseeUserId: addresseeId,
				pairKey,
				status: "pending",
			},
		});

		return NextResponse.json({ friendship }, { status: 201 });
	} catch (error) {
		console.error("Error creating friend request:", error);
		return NextResponse.json({ error: "フレンド申請に失敗しました" }, { status: 500 });
	}
}
