import React, { useState } from "react";
import {
  Clock,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  BellRing
} from "lucide-react";
import { API_KEY } from "../api";

export const SettingsView: React.FC = () => {
  const [showKey, setShowKey] = useState(false);
  const apiKey = API_KEY;

  return (
    <div className="space-y-6 max-w-3xl text-left">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-400">Konfigurasi parameter sistem harian dan kredensial API Alkhasya.</p>
      </div>

      <div className="grid gap-6">
        {/* Timezone & Working Hours */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" /> Waktu Kerja & Zona Waktu
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Default Timezone</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span>Asia/Jakarta (GMT+07:00)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Working Hours</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span>09:00 - 18:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Briefing Times */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-500" /> Jadwal Briefing & Review Otomatis
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Morning Briefing</label>
              <div className="mt-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
                <span>Setiap Hari · 08:30 WIB</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End-of-day Review</label>
              <div className="mt-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
                <span>Setiap Hari · 17:30 WIB</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inactivity Alarm Threshold</label>
              <div className="mt-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
                <span>48 Jam Tanpa Update</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & API Key */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Kredensial Keamanan (Local API Key)
          </h3>
          
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alkhasya API Token (X-API-KEY)</label>
            <div className="mt-1.5 flex gap-2">
              <div className="flex-1 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-300">
                <span>{showKey ? apiKey : "••••••••••••••••••••••••••••••••••••••••"}</span>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              *Gunakan API Token ini pada file konfigurasi/skill di Alkhasya Agent Anda agar agent dapat mengakses, membaca, serta menulis data tugas secara aman langsung ke MariaDB.
            </p>
          </div>
        </div>

        {/* Technical Support Information */}
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6">
          <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" /> Tentang Sistem Alkhasya Dashboard
          </h4>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Sistem Alkhasya Work Management didesain menggunakan prinsip pemisahan interface. Web visual menggunakan teknologi React untuk Kanban & Analytics, sedangkan interface conversational dijalankan oleh Alkhasya Agent via Telegram yang terintegrasi secara langsung menggunakan koneksi API REST lokal.
          </p>
          <div className="mt-4 flex gap-4 text-[11px] text-zinc-500">
            <span>Versi Dashboard: 1.0.0 (MVP)</span>
            <span>Versi API: 1.0.0 (Express/Node)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
