import Link from "next/link";
import "../legal.css";

export const metadata = {
	title: "プライバシーポリシー | 将棋ゲーム",
	description: "将棋ゲームのプライバシーポリシーです。個人情報の取り扱いについてご確認ください。",
};

export default function PrivacyPage() {
	return (
		<div className="legal-page">
			<header className="legal-header">
				<Link href="/login" className="legal-back">
					← 戻る
				</Link>
				<span className="legal-header-title">プライバシーポリシー</span>
			</header>

			<main className="legal-content">
				<h1 className="legal-title">プライバシーポリシー</h1>
				<p className="legal-subtitle">Privacy Policy</p>

				<section className="legal-section">
					<h2 className="legal-section-title">はじめに</h2>
					<p>
						将棋ゲーム（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
						個人情報の保護に努めます。本プライバシーポリシーは、本サービスが収集する情報、
						その利用方法、およびユーザーの権利について説明するものです。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">1. 収集する情報</h2>
					<p>本サービスでは、以下の情報を収集します。</p>

					<h3 style={{ color: "rgba(245, 230, 200, 0.8)", fontSize: "0.95rem", fontWeight: 600, marginTop: "16px", marginBottom: "8px" }}>
						アカウント情報
					</h3>
					<ul>
						<li>メールアドレス</li>
						<li>表示名（ユーザー名）</li>
						<li>パスワード（ハッシュ化して保存）</li>
						<li>OAuth連携時のプロバイダ情報（GitHub、Googleアカウント識別子）</li>
					</ul>

					<h3 style={{ color: "rgba(245, 230, 200, 0.8)", fontSize: "0.95rem", fontWeight: 600, marginTop: "16px", marginBottom: "8px" }}>
						ゲームデータ
					</h3>
					<ul>
						<li>対局履歴（勝敗、対局日時、対戦相手）</li>
						<li>戦績</li>
						<li>フレンドリスト</li>
					</ul>

					<h3 style={{ color: "rgba(245, 230, 200, 0.8)", fontSize: "0.95rem", fontWeight: 600, marginTop: "16px", marginBottom: "8px" }}>
						技術的情報
					</h3>
					<ul>
						<li>セッション情報</li>
						<li>Cookieデータ</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">2. 情報の利用目的</h2>
					<p>収集した情報は、以下の目的で利用します。</p>
					<ul>
						<li>ユーザー認証・アカウント管理</li>
						<li>オンライン対戦のマッチング・対局処理</li>
						<li>対戦履歴・戦績の記録と表示</li>
						<li>フレンド機能の提供</li>
						<li>サービスの改善・不具合の修正</li>
						<li>不正利用の検出・防止</li>
					</ul>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">3. 情報の保護</h2>
					<p>
						本サービスは、ユーザーの個人情報を適切に保護するため、セキュリティ対策を実施しています。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">4. Cookieの使用</h2>
					<p>
						本サービスでは、以下の目的でCookieを使用しています。
					</p>
					<ul>
						<li>ログイン状態の維持（セッション管理）</li>
						<li>認証トークンの保存</li>
						<li>ユーザー設定の記憶</li>
					</ul>
					<p>
						Cookieを無効にした場合、本サービスの一部機能（ログイン機能等）が正常に動作しない場合があります。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">5. 第三者への情報提供</h2>
					<p>
						本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
					</p>
					<ul>
						<li>ユーザー本人の同意がある場合</li>
						<li>法令に基づく開示請求があった場合</li>
						<li>人の生命・身体・財産の保護のために必要な場合</li>
					</ul>
					<p>
						なお、OAuth認証（GitHub、Google）を使用してログインした場合、
						認証に必要な最低限の情報がこれらの外部サービスとやり取りされます。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">6. ユーザーの権利</h2>
					<p>ユーザーは、自身の個人情報について、以下の権利を有します。</p>
					<ul>
						<li>登録情報の閲覧・修正（プロフィール設定画面から可能）</li>
						<li>アカウントの削除の依頼</li>
						<li>個人情報の利用停止の依頼</li>
						<li>保有する個人情報の開示請求</li>
					</ul>
					<p>
						これらの権利を行使する場合は、運営者までご連絡ください。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">7. 未成年者のプライバシー</h2>
					<p>
						本サービスは、13歳未満のお子様を対象としていません。
						13歳未満のお子様が個人情報を提供したことが判明した場合、
						速やかに当該情報を削除いたします。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">8. ポリシーの変更</h2>
					<p>
						本プライバシーポリシーは、必要に応じて変更されることがあります。
						変更後のポリシーは、本ページに掲載された時点で効力を生じます。
						重要な変更がある場合は、サービス内で通知いたします。
					</p>
				</section>

				<section className="legal-section">
					<h2 className="legal-section-title">9. お問い合わせ</h2>
					<p>
						プライバシーに関するご質問・ご要望がございましたら、
						サービス内のお問い合わせ機能または運営者宛にご連絡ください。
					</p>
				</section>

				<p className="legal-updated">最終更新日: 2026年3月29日</p>
			</main>
		</div>
	);
}
