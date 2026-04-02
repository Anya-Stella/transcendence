import Link from "next/link";
import "../legal.css";

export const metadata = {
	title: "利用規約 | 将棋ゲーム",
	description: "将棋ゲームの利用規約ページです。サービスの利用条件をご確認ください。",
};

export default function TermsPage() {
	return (
		<div className="legal-page">
			<header className="legal-header">
				<Link href="/login" className="legal-back">
					← 戻る
				</Link>
				<span className="legal-header-title">利用規約</span>
			</header>

			<main className="legal-content">
				<h1 className="legal-title">利用規約</h1>
				<p className="legal-subtitle">Terms of Service</p>

				<section className="legal-section">
					<h2 className="legal-section-title">第1条（適用）</h2>
					<p>
						本利用規約（以下「本規約」）は、将棋ゲーム（以下「本サービス」）の利用に関する条件を定めるものです。
						ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第2条（サービスの概要）</h2>
					<p>
						本サービスは、5×5マスの将棋（ミニ将棋）をオンラインで楽しむためのウェブアプリケーションです。
						以下の機能を提供します。
					</p>
					<ul>
						<li>ユーザーアカウントの作成・管理</li>
						<li>オンライン対戦（リアルタイムマッチング）</li>
						<li>AI（コンピュータ）との対局</li>
						<li>他のプレイヤーの対局の観戦</li>
						<li>フレンド機能（友達の追加・管理）</li>
						<li>対戦履歴・戦績の記録</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第3条（アカウント登録）</h2>
					<p>
						本サービスの利用にはアカウント登録が必要です。ユーザーは以下の事項を遵守するものとします。
					</p>
					<ul>
						<li>正確かつ最新の情報を登録すること</li>
						<li>アカウント情報（メールアドレス・パスワード）を第三者に開示しないこと</li>
						<li>1人につき1つのアカウントのみ作成すること</li>
						<li>アカウントの管理は自己の責任において行うこと</li>
					</ul>
					<p>
						第三者によるアカウントの不正利用があった場合、速やかに運営者に報告してください。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第4条（禁止事項）</h2>
					<p>ユーザーは、本サービスの利用に際して、以下の行為を行ってはなりません。</p>
					<ul>
						<li>不正なプログラム（チート・ボット等）を使用して対局する行為</li>
						<li>他のユーザーへの嫌がらせ・誹謗中傷・脅迫行為</li>
						<li>本サービスのサーバー・ネットワークに過度な負荷をかける行為</li>
						<li>本サービスのソースコード・データの不正な取得・改ざん</li>
						<li>他のユーザーのアカウントを不正に使用する行為</li>
						<li>故意に対局を放棄・遅延させる行為（タイムアウト狙い等）</li>
						<li>法令または公序良俗に反する行為</li>
						<li>運営者が不適切と判断するその他の行為</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第5条（サービスの変更・中断・終了）</h2>
					<p>
						運営者は、以下の場合にサービスの全部または一部を中断・終了することがあります。
						これによりユーザーに生じた損害について、運営者は責任を負いません。
					</p>
					<ul>
						<li>サーバーの保守・点検を行う場合</li>
						<li>天災・停電等の不可抗力が発生した場合</li>
						<li>その他、運営上やむを得ない事由がある場合</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第6条（知的財産権）</h2>
					<p>
						本サービスに関するすべてのコンテンツ（テキスト、画像、デザイン、プログラム等）の知的財産権は、
						運営者または正当な権利者に帰属します。ユーザーは、運営者の事前の書面による承諾なく、
						これらのコンテンツを複製・転載・改変・販売することはできません。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第7条（免責事項）</h2>
					<ul>
						<li>本サービスは現状有姿で提供されます。運営者は、サービスの完全性・正確性・可用性について保証しません。</li>
						<li>ユーザー間のトラブルについて、運営者は一切の責任を負いません。</li>
						<li>本サービスの利用により生じた損害について、運営者の故意または重過失による場合を除き、運営者は責任を負いません。</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第8条（規約の変更）</h2>
					<p>
						運営者は、必要に応じて本規約を変更できるものとします。
						変更後の規約は、本ページに掲載された時点で効力を生じます。
						変更後に本サービスを利用した場合、変更後の規約に同意したものとみなされます。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">第9条（準拠法・管轄）</h2>
					<p>
						本規約は日本法に準拠するものとします。
						本サービスに関する紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
					</p>
				</section>

				<p className="legal-updated">最終更新日: 2026年3月29日</p>
			</main>
		</div>
	);
}
