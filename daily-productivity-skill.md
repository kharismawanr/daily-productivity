---
name: daily-productivity
description: Manage tasks and projects via the Daily Productivity API, with automated reminders.
version: 1.0.0
author: Aris, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [productivity, task-management, project, reminders, daily-brief]
---

# Hermes Daily Productivity Skill

**Trigger:** Use whenever the user asks to:
- Catat/tambah tugas/task baru (misal: "catat task meeting besok jam 10")
- Cek tugas hari ini, overdue task, atau ringkasan harian ("briefing pagi", "summary harian")
- Update progress/status tugas ("task meeting udah dikerjakan", "progress report udah 80%")
- Atur deadline/prioritas ("ubah deadline report ke besok sore", "jadikan task X prioritas tinggi")
- Buat proyek baru ("buat proyek MRP Automation")
- Selesaikan tugas ("task meeting koordinasi selesai")

## Execution Protocol (Crucial)
You must interact with the Daily Productivity API by executing `curl` commands through the **`terminal`** tool.

| Item | Value |
|------|-------|
| Base URL | `http://127.0.0.1:3002/api/v1` (Local port 3002 on this host) |
| Auth | Header `X-API-KEY: $API_KEY` |

---

## Core Operations (Use `terminal` with `curl`)

### 1. Mencatat Tugas Baru (Create Task)

Jalankan `curl` berikut menggunakan `terminal` tool:
```bash
curl -s -X POST http://127.0.0.1:3002/api/v1/hermes/task/create \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "<title>", "project": "<project_name_optional>", "priority": "<LOW|MEDIUM|HIGH|URGENT>", "deadline": "<YYYY-MM-DD HH:mm:ss_optional>"}'
```

**Sangat Penting (Pendaftaran Reminder Otomatis):**
Jika tugas memiliki `deadline`, setelah berhasil membuat tugas di API, Anda **WAJIB** menggunakan tool **`cronjob`** bawaan Anda untuk menjadwalkan pengingat otomatis:
*   Ukur waktu pendaftaran reminder (misal: tepat pada waktu deadline atau 1 jam sebelumnya).
*   **Format Pendaftaran Reminder:**
    ```
    cronjob("create", {
      "schedule": "0 10 13 8 *",  // Ubah ke format cron sesuai waktu tenggat tugas (misal: jam 10:00 tanggal 13 Agustus)
      "prompt": "PENTING: Cek status tugas ke API terlebih dahulu: curl -s http://127.0.0.1:3002/api/v1/tasks/<id_tugas_dari_respon_sebelumnya> -H 'X-API-KEY: $API_KEY'.
                 Jika status tugas di respon JSON sudah 'DONE', kembalikan respon '[SILENT]' agar tidak mengirim notifikasi apa pun ke user (Protocol Diam).
                 Jika status tugas BELUM selesai (TODO/IN_PROGRESS/BLOCKED), sapa user (sapa dengan hormat, misal: 'Yang Mulia' dengan gaya ceria) dan ingatkan bahwa deadline tugas '<title>' adalah jam 10:00 hari ini."
    })
    ```
    *Catatan:* Protocol `[SILENT]` memastikan bahwa jika tugas sudah Anda selesaikan lewat Web UI, Anda tidak akan terganggu oleh spam notifikasi!

---

### 2. Update Status / Progress Tugas (Update Task)

Jalankan `curl` berikut menggunakan `terminal` tool:
```bash
curl -s -X POST http://127.0.0.1:3002/api/v1/hermes/task/update \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "<title>", "status": "<BACKLOG|TODO|IN_PROGRESS|BLOCKED|DONE>", "progress_percent": <percent_optional>}'
```

---

### 3. Menyelesaikan Tugas (Complete Task)

Jalankan `curl` berikut menggunakan `terminal` tool:
```bash
curl -s -X POST http://127.0.0.1:3002/api/v1/hermes/task/complete \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "<title>"}'
```

---

### 4. Mengambil Ringkasan Harian (Daily Summary)

Jalankan `curl` berikut menggunakan `terminal` tool:
```bash
curl -s http://127.0.0.1:3002/api/v1/hermes/daily-summary \
  -H "X-API-KEY: $API_KEY"
```
Ambil properti `text_summary` dari respon JSON dan bacakan langsung kepada user sebagai briefing Anda.

---

## Contoh Interaksi (One-Shot)

> **User:** "Hermes, tolong catat task review SLA vendor besok jam 3 sore."
> **Hermes:** (Memanggil API menggunakan `terminal` dengan `curl` untuk membuat tugas, lalu memanggil `cronjob` untuk menjadwalkan alarm)
> **Hermes:** "Siap, Yang Mulia! Tugas **'Review SLA vendor'** telah saya catat di database untuk besok jam 15:00. Saya juga sudah menyetel alarm pengingat otomatis di Telegram agar tidak terlupakan. Semangat terus! 🚀"
