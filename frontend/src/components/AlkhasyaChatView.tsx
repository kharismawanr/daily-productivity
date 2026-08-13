import React, { useState, useRef, useEffect } from "react";
import { Send, Zap, User, RefreshCw, Info } from "lucide-react";
import { getApiUrl, API_KEY } from "../api";

interface Message {
  sender: "USER" | "ALKHASYA";
  text: string;
  timestamp: Date;
}

interface AlkhasyaChatViewProps {
  onRefreshAll: () => void;
}

export const AlkhasyaChatView: React.FC<AlkhasyaChatViewProps> = ({ onRefreshAll }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ALKHASYA",
      text: "Selamat datang kembali, Yang Mulia Aris! ⚡ Saya Alkhasya Agent. Saya siap mendengarkan instruksi harian Anda seperti mencatat tugas baru, menyelesaikan tugas, atau meminta ringkasan (daily summary) harian.\n\nContoh yang bisa dicoba:\n👉 \"catat task review SLA vendor lusa jam 15:00\"\n👉 \"task review SLA vendor selesai\"\n👉 \"minta briefing harian\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseLocalCommand = (text: string) => {
    const rawText = text.toLowerCase().trim();

    if (rawText.includes("summary") || rawText.includes("brief") || rawText.includes("laporan") || rawText.includes("ringkasan")) {
      return { action: "summary" };
    }

    const completeMatch = rawText.match(/(?:selesai|complete|beres|selesaikan|tutup)\s+task\s+(.+)$/) ||
                        rawText.match(/(.+?)\s+(?:selesai|beres|complete|done)$/);
    if (completeMatch) {
      const taskTitle = completeMatch[1].replace(/^(?:task|tugas)\s+/gi, "").trim();
      return { action: "complete", title: taskTitle };
    }

    const createMatch = rawText.match(/(?:catat|tambah|bikin|buat)\s+(?:task|tugas)\s+(.+)$/);
    if (createMatch) {
      let bodyText = createMatch[1].trim();
      let deadline: string | null = null;
      let title = bodyText;
      let project: string | null = null;
      let priority = "MEDIUM";

      const today = new Date();
      let targetDate = new Date();

      let dayResolved = false;
      if (bodyText.includes("besok")) {
        targetDate.setDate(today.getDate() + 1);
        bodyText = bodyText.replace(/\s*besok\s*/gi, " ");
        dayResolved = true;
      } else if (bodyText.includes("lusa")) {
        targetDate.setDate(today.getDate() + 2);
        bodyText = bodyText.replace(/\s*lusa\s*/gi, " ");
        dayResolved = true;
      } else if (bodyText.includes("hari ini")) {
        bodyText = bodyText.replace(/\s*hari ini\s*/gi, " ");
        dayResolved = true;
      }

      const timeMatch = bodyText.match(/jam\s*(\d{1,2})(?::(\d{2}))?(?:\s*(siang|sore|malam|pagi))?/i);
      if (timeMatch) {
        let hour = Number(timeMatch[1]);
        const min = timeMatch[2] ? Number(timeMatch[2]) : 0;
        const period = timeMatch[3];

        if (period) {
          const p = period.toLowerCase();
          if ((p === "sore" || p === "malam" || p === "siang") && hour < 12) {
            hour += 12;
          }
        } else if (hour < 8) {
          hour += 12;
        }

        targetDate.setHours(hour, min, 0, 0);
        bodyText = bodyText.replace(/jam\s*\d{1,2}(?::\d{2})?(?:\s*(siang|sore|malam|pagi))?/gi, " ");
        dayResolved = true;
      }

      if (dayResolved) {
        deadline = targetDate.toISOString().slice(0, 19).replace("T", " ");
      }

      const projMatch = bodyText.match(/(?:di|untuk|proyek|project)\s+(?:project|proyek)?\s*([a-zA-Z0-9\s]+?)(?:\s*($|prioritas|dengan|deskripsi))/i);
      if (projMatch) {
        project = projMatch[1].trim();
        bodyText = bodyText.replace(/(?:di|untuk|proyek|project)\s+(?:project|proyek)?\s*[a-zA-Z0-9\s]+?/gi, " ");
      }

      if (bodyText.includes("tinggi") || bodyText.includes("high")) {
        priority = "HIGH";
        bodyText = bodyText.replace(/\s*(prioritas)?\s*(tinggi|high)\s*/gi, " ");
      } else if (bodyText.includes("urgent") || bodyText.includes("mendesak")) {
        priority = "URGENT";
        bodyText = bodyText.replace(/\s*(prioritas)?\s*(urgent|mendesak)\s*/gi, " ");
      } else if (bodyText.includes("rendah") || bodyText.includes("low")) {
        priority = "LOW";
        bodyText = bodyText.replace(/\s*(prioritas)?\s*(rendah|low)\s*/gi, " ");
      }

      title = bodyText.replace(/\s+/g, " ").trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);

      return {
        action: "create",
        title,
        deadline,
        project,
        priority
      };
    }

    return { action: "unknown" };
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: "USER", text: userMessage, timestamp: new Date() }]);
    setSending(true);

    try {
      const command = parseLocalCommand(userMessage);
      const apiUrl = getApiUrl();

      if (command.action === "summary") {
        const response = await fetch(`${apiUrl}/hermes/daily-summary`, {
          headers: { "x-api-key": API_KEY }
        });
        const result = await response.json();
        
        if (result.success) {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            // Dynamically rename any nested Hermes to Alkhasya
            text: `Berikut adalah ringkasan produktivitas harian Anda hari ini, Yang Mulia Aris! 📋\n\n${result.text_summary.replace(/Hermes/g, "Alkhasya")}\n\nSemua data ditarik secara real-time dari database produksi MariaDB.`,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: "Maaf, Yang Mulia, saya gagal mengambil data ringkasan dari database. Pastikan backend server terhubung.",
            timestamp: new Date()
          }]);
        }

      } else if (command.action === "complete" && command.title) {
        const response = await fetch(`${apiUrl}/hermes/task/complete`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          },
          body: JSON.stringify({ title: command.title })
        });
        const result = await response.json();

        if (result.success) {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: `Laporan diterima, Yang Mulia! Tugas **"${result.data.title}"** telah berhasil diselesaikan dan dicatat sebagai **DONE** di database harian Anda. Progres visual di Kanban telah terupdate secara otomatis! 🏆✅`,
            timestamp: new Date()
          }]);
          onRefreshAll();
        } else {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: `Maaf Yang Mulia, saya mencari tugas dengan judul mirip "${command.title}" yang aktif, namun tidak berhasil menemukannya di database harian Anda. Mohon diperiksa kembali judul tugas tersebut.`,
            timestamp: new Date()
          }]);
        }

      } else if (command.action === "create" && command.title) {
        const response = await fetch(`${apiUrl}/hermes/task/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          },
          body: JSON.stringify({
            title: command.title,
            deadline: command.deadline,
            project: command.project,
            priority: command.priority
          })
        });
        const result = await response.json();

        if (result.success) {
          const task = result.data;
          let replyText = `Siap, Yang Mulia! Tugas **"${task.title}"** telah saya catat di database harian Anda.\n\n`;
          if (task.project_id) {
            replyText += `📁 Proyek: **${command.project}**\n`;
          }
          replyText += `🏷️ Prioritas: **${task.priority}**\n`;
          if (task.deadline) {
            replyText += `⏰ Tenggat Waktu: **${new Date(task.deadline).toLocaleString("id-ID")}**\n`;
            replyText += `🔔 *Alarm reminder otomatis telah dijadwalkan di Telegram Bot Anda.*`;
          } else {
            replyText += `⏰ Tanpa tenggat waktu khusus.`;
          }

          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: replyText,
            timestamp: new Date()
          }]);
          onRefreshAll();
        } else {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: "Maaf Yang Mulia, terjadi kegagalan sistem saat saya mencoba menyimpan tugas ke database MariaDB.",
            timestamp: new Date()
          }]);
        }

      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            sender: "ALKHASYA",
            text: "Mohon maaf Yang Mulia, saya kurang memahami perintah tersebut. Saat ini saya diprogram khusus untuk mencatat tugas baru, menyelesaikan tugas, atau memberikan summary.\n\nCobalah sapaan perintah seperti:\n📝 *\"bikin task review SLA vendor lusa sore\"*\n✅ *\"task review SLA vendor selesai\"*\n📊 *\"minta briefing harian\"*",
            timestamp: new Date()
          }]);
        }, 1000);
      }

    } catch (err) {
      console.error("Alkhasya chat error:", err);
      setMessages(prev => [...prev, {
        sender: "ALKHASYA",
        text: "Koneksi terputus. Mohon pastikan API backend berjalan dengan lancar.",
        timestamp: new Date()
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-zinc-800/80 bg-zinc-950 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Alkhasya Agent Console</h3>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Online · Connected to Telegram Skill Core
            </p>
          </div>
        </div>
        <button 
          onClick={onRefreshAll}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
          title="Refresh All Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isAlkhasya = msg.sender === "ALKHASYA";
          return (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${isAlkhasya ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center border flex-shrink-0 font-bold text-xs ${
                isAlkhasya 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}>
                {isAlkhasya ? <Zap className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Bubble text */}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                isAlkhasya 
                  ? "bg-zinc-900/60 border border-zinc-800 text-zinc-200" 
                  : "bg-emerald-500 text-zinc-950 font-medium"
              }`}>
                {msg.text}
                <span className={`block text-[9px] mt-1.5 text-right ${isAlkhasya ? "text-zinc-500" : "text-emerald-950/70"}`}>
                  {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Zap className="h-4 w-4 animate-bounce" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-sm italic">
              Alkhasya sedang menulis ke database...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions Panel */}
      <div className="bg-zinc-900/20 border-t border-zinc-900 px-6 py-2.5 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase font-bold text-zinc-600 flex items-center gap-1">
          <Info className="h-3 w-3" /> Quick suggestions:
        </span>
        <button 
          onClick={() => setInput("catat task Beli Kopi Arabika besok jam 10 pagi")}
          className="text-xs rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition"
        >
          📝 Catat tugas baru
        </button>
        <button 
          onClick={() => setInput("task Beli Kopi Arabika selesai")}
          className="text-xs rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition"
        >
          ✅ Selesaikan tugas
        </button>
        <button 
          onClick={() => setInput("minta briefing harian")}
          className="text-xs rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition"
        >
          📊 Ringkasan harian
        </button>
      </div>

      {/* Input Panel */}
      <div className="border-t border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis pesan ke Alkhasya..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-zinc-600 placeholder-zinc-500"
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 flex items-center justify-center font-bold transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
