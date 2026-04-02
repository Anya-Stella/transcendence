"use client";

import Link from "next/link";
import React from "react";

interface HeaderProps {
    /**
     * ロゴ部分に表示するテキスト。デフォルトは "将棋ゲーム"
     */
    title?: string;
    /**
     * ロゴクリック時の遷移先。デフォルトは "/home"
     */
    logoHref?: string;
    /**
     * ページ名。ロゴの右側や右セクションに補助的に表示されます。
     */
    pageName?: string;
    /**
     * 表示するユーザー名。
     */
    userName?: string | null;
    /**
     * ログアウト/退出ボタンのクリックハンドラ。
     */
    onLogout?: () => void;
    /**
     * ログアウト/退出ボタンのラベル。デフォルトは "ログアウト"
     */
    logoutLabel?: string;
    /**
     * 「戻る」ボタンの遷移先。
     */
    backHref?: string;
    /**
     * 「戻る」ボタンのラベル。デフォルトは "戻る"
     */
    backLabel?: string;
    /**
     * 右側にカスタムで表示したい要素。
     */
    rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title = "将棋ゲーム",
    logoHref = "/home",
    pageName,
    userName,
    onLogout,
    logoutLabel = "ログアウト",
    backHref,
    backLabel = "戻る",
    rightElement,
}) => {
    return (
        <header className="wafuu-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {logoHref ? (
                    <Link href={logoHref} className="wafuu-header-logo">
                        {title}
                    </Link>
                ) : (
                    <div className="wafuu-header-logo">{title}</div>
                )}
                {pageName && (
                    <span style={{ color: "rgba(245, 230, 200, 0.4)", fontSize: "0.8rem", marginTop: "4px" }}>
                        {pageName}
                    </span>
                )}
            </div>

            <div className="wafuu-header-right">
                {/* ユーザー名 (プロフィールのリンク) */}
                {userName && (
                    <Link
                        href="/profile"
                        className="wafuu-header-username"
                        style={{ cursor: "pointer", textDecoration: "underline" }}
                    >
                        {userName}
                    </Link>
                )}

                {/* カスタム要素 */}
                {rightElement}

                {/* 戻るボタン */}
                {backHref && (
                    <Link href={backHref} className="wafuu-header-btn">
                        {backLabel}
                    </Link>
                )}

                {/* ログアウト/退出ボタン */}
                {onLogout && (
                    <button className="wafuu-header-btn" onClick={onLogout}>
                        {logoutLabel}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
