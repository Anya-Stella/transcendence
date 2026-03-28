import { Pos } from "@torassen/shogi-logic";
import { defaultErrorMap } from "zod";

interface PromotionProps {
    Dialog: { from: Pos; to: Pos };
    promoteDialog: (dialog: { from: { row: number; col: number }; to: { row: number; col: number } } | null) => void;
    onExecute: (from: Pos, to: Pos, promote: boolean) => void;
}

export default function PromotionButton({ Dialog, promoteDialog, onExecute }: PromotionProps) {
    return (
        <div className="promote-overlay" style={{ zIndex: 1000 }} onClick={() => promoteDialog(null)}>
            <div className="promote-dialog" onClick={(e) => e.stopPropagation()}>
                <p className="promote-title">成りますか？</p>
                <div className="promote-buttons">
                    <button
                        className="btn promote-btn promote-btn-yes"
                        onClick={() => onExecute(Dialog.from, Dialog.to, true)}
                    >
                        成る
                    </button>
                    <button
                        className="btn promote-btn promote-btn-no"
                        onClick={() => onExecute(Dialog.from, Dialog.to, false)}
                    >
                        不成
                    </button>
                </div>
            </div>
        </div>
    );
}
