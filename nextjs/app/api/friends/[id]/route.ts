import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// フレンド申請の承認
export async function PUT(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	try {
		const friendshipId = params.id;
		const userId = session.user.id;
		if (!userId) {
			return NextResponse.json({ error: "ユーザーIDが不明です" }, { status: 400 });
		}

		const friendship = await prisma.friendship.findUnique({
			where: { id: friendshipId },
		});

		if (!friendship) {
			return NextResponse.json({ error: "フレンド申請が見つかりません" }, { status: 404 });
		}

		// 自分が addressee で、status が "pending" であること
		if (friendship.addresseeUserId !== userId) {
			return NextResponse.json({ error: "この申請を承認する権限がありません" }, { status: 403 });
		}

		if (friendship.status === "accepted") {
			return NextResponse.json({ error: "既に承認済みです" }, { status: 400 });
		}

		const updated = await prisma.friendship.update({
			where: { id: friendshipId },
			data: { status: "accepted" },
		});

		return NextResponse.json({ friendship: updated });
	} catch (error) {
		console.error("Error accepting friend request:", error);
		return NextResponse.json({ error: "フレンド申請の承認に失敗しました" }, { status: 500 });
	}
}

// フレンドの削除 / 申請の拒否・取り消し
export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	try {
		const friendshipId = params.id;
		const userId = session.user.id;
		if (!userId) {
			return NextResponse.json({ error: "ユーザーIDが不明です" }, { status: 400 });
		}

		const friendship = await prisma.friendship.findUnique({
			where: { id: friendshipId },
		});

		if (!friendship) {
			return NextResponse.json({ error: "指定されたデータが見つかりません" }, { status: 404 });
		}

		// 自分が関係しているかチェック
		if (friendship.requesterUserId !== userId && friendship.addresseeUserId !== userId) {
			return NextResponse.json({ error: "この操作権限がありません" }, { status: 403 });
		}

		await prisma.friendship.delete({
			where: { id: friendshipId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting friendship:", error);
		return NextResponse.json({ error: "フレンド情報の削除に失敗しました" }, { status: 500 });
	}
}
