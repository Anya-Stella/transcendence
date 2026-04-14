"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { PlayerSide } from "@/types/game";

export const getSideLabel = (side: PlayerSide) =>
  side === "sente" ? "先手" : side === "gote" ? "後手" : "観戦者";

interface Message {
  id: string;
  name: string;
  text: string;
  stampId?: string;
  side: PlayerSide;
  timestamp: number;
}

const STAMPS = [
  { id: "yoroshiku", text: "よろしくお願いします", icon: "🙇" },
  { id: "mairimashita", text: "参りました", icon: "🏳️" },
  { id: "oute", text: "王手！", icon: "⚔️" },
  { id: "matta", text: "待った！", icon: "⏳" },
  { id: "arigatou", text: "対局ありがとうございました", icon: "✨" },
  { id: "choukou", text: "長考ですね？", icon: "🕰️" },
  { id: "suji", text: "なるほど、その筋ですか", icon: "🤔" },
  { id: "soko", text: "えっ、そこ！？", icon: "😲" },
  { id: "miemie", text: "見え見えです", icon: "👓" },
  { id: "fufufu", text: "フフフ…", icon: "😎" },
  { id: "netero", text: "そりゃ悪手だろ蟻んコ…", icon: "🐜" },
  { id: "itte", text: "おそろしく速い一手　オレでなきゃ見逃しちゃうね", icon: "⚡" },
];

interface ChatProps {
  socket: Socket | null | undefined;
  roomId: string;
  mySide: PlayerSide;
  initialMessages?: Message[];
}

export default function Chat({ socket, roomId, mySide, initialMessages }: ChatProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "ゲスト";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStampPickerOpen, setIsStampPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat", handleChatMessage);

    return () => {
      socket.off("chat", handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!socket || !inputValue.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      name: userName,
      text: inputValue.trim(),
      side: mySide,
      timestamp: Date.now(),
    };

    socket.emit("chat", { roomId, message: newMessage });
    // ローカルにも即座に反映（サーバーがBroadcastしない場合も考慮、またはサーバーが自分以外に送る場合）
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsStampPickerOpen(false);
  };

  const handleStampSend = (stampId: string) => {
    if (!socket) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      name: userName,
      text: "",
      stampId,
      side: mySide,
      timestamp: Date.now(),
    };
    socket.emit("chat", { roomId, message: newMessage });
    setMessages((prev) => [...prev, newMessage]);
    setIsStampPickerOpen(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => {
          const isStamp = !!msg.stampId;
          const stampData = isStamp ? STAMPS.find((s) => s.id === msg.stampId) : null;
          return (
            <div key={msg.id} className={`chat-message chat-side-${msg.side} ${isStamp ? "is-stamp" : ""}`}>
              <span className="chat-sender">[{getSideLabel(msg.side)}]：{msg.name}</span>
              {isStamp && stampData ? (
                <div className="stamp-content">
                  <span className="stamp-icon">{stampData.icon}</span>
                  <span className="stamp-text">{stampData.text}</span>
                </div>
              ) : (
                <span className="chat-text">{msg.text}</span>
              )}
            </div>
          );
        })}
      </div>

      {isStampPickerOpen && (
        <div className="stamp-picker">
          {STAMPS.map((stamp) => (
            <button key={stamp.id} className="stamp-item" onClick={() => handleStampSend(stamp.id)}>
              <span className="stamp-icon">{stamp.icon}</span>
              <span className="stamp-label">{stamp.text}</span>
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <button
          className="chat-stamp-btn"
          onClick={() => setIsStampPickerOpen(!isStampPickerOpen)}
          title="スタンプを送る"
        >
          😊
        </button>
        <input
          type="text"
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              handleSend();
            }
          }}
          placeholder={`${userName}として発言...`}
        />
        <button className="chat-send-btn" onClick={handleSend}>
          ⇧
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          position: fixed;
          bottom: 80px;
          left: 20px;
          width: 400px;
          height: 200px;
          background: rgba(20, 15, 10, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          pointer-events: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          /* overflow: hidden; Removed so stamp picker can exceed height if needed */
        }

        .chat-messages {
          flex: 1;
          padding: 8px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 3px;
        }

        .chat-message {
          font-size: 0.8rem;
          line-height: 1.4;
          word-break: break-all;
        }

        .chat-sender {
          font-weight: bold;
          margin-right: 6px;
          color: rgba(245, 230, 200, 0.6);
        }

        .chat-side-sente .chat-sender {
          color: #d4af37;
        }
        .chat-side-gote .chat-sender {
          color: #6b8f63;
        }

        .chat-text {
          color: #f5e6c8;
        }

        .chat-input-area {
          padding: 10px;
          background: rgba(10, 8, 5, 0.5);
          border-top: 1px solid rgba(212, 175, 55, 0.15);
          display: flex;
          gap: 8px;
        }

        .chat-input {
          flex: 1;
          background: rgba(245, 230, 200, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          padding: 6px 10px;
          color: #f5e6c8;
          font-size: 0.85rem;
          outline: none;
        }

        .chat-input:focus {
          border-color: rgba(212, 175, 55, 0.5);
        }

        .chat-send-btn {
          background: linear-gradient(135deg, #b8860b, #d4af37);
          border: none;
          border-radius: 6px;
          color: #1a1208;
          font-weight: bold;
          padding: 0 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.8rem;
        }

        .chat-send-btn:hover {
          filter: brightness(1.2);
          transform: translateY(-1px);
        }

        .chat-stamp-btn {
          background: rgba(245, 230, 200, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          color: #f5e6c8;
          padding: 0 8px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-stamp-btn:hover {
          background: rgba(212, 175, 55, 0.2);
        }

        .stamp-picker {
          position: absolute;
          bottom: 52px;
          left: -10px;
          width: 400px;
          background: rgba(20, 15, 10, 0.95);
          border: 1px solid rgba(212, 175, 55, 0.5);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.5);
          z-index: 101;
        }
        .stamp-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 230, 200, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          color: #f5e6c8;
          text-align: left;
          transition: all 0.2s;
          flex: 1 1 calc(50% - 6px);
        }
        .stamp-item:hover {
          background: rgba(212, 175, 55, 0.4);
          transform: translateY(-1px);
          border-color: rgba(212, 175, 55, 0.8);
        }
        .stamp-item .stamp-icon {
          font-size: 1.1rem;
        }
        .stamp-item .stamp-label {
          font-size: 0.75rem;
          font-weight: bold;
          white-space: nowrap;
        }

        .chat-message.is-stamp {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stamp-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(184, 134, 11, 0.3));
          border: 1px solid rgba(212, 175, 55, 0.5);
          border-radius: 12px;
          padding: 6px 12px;
          align-self: flex-start;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          margin-top: 2px;
        }
        .chat-side-gote .stamp-content {
          background: linear-gradient(135deg, rgba(107, 143, 99, 0.1), rgba(74, 103, 65, 0.3));
          border-color: rgba(107, 143, 99, 0.5);
        }
        .chat-side-spectator .stamp-content {
          background: linear-gradient(135deg, rgba(245, 230, 200, 0.05), rgba(245, 230, 200, 0.15));
          border-color: rgba(245, 230, 200, 0.3);
        }
        .stamp-content .stamp-icon {
          font-size: 1.2rem;
        }
        .stamp-content .stamp-text {
          font-size: 0.85rem;
          font-weight: bold;
          color: #fcebbb;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
}
