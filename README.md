# TOEIC Xanh

Webapp tự học TOEIC Nghe + Đọc, 15 phút mỗi ngày, cho người bắt đầu từ con số 0.

## Chạy

```bash
docker compose up -d        # lần đầu tự cài gói, sau đó mở http://localhost:3100
docker compose logs -f web  # xem log
docker compose down         # dừng
```

Máy có Node 20 trở lên và được phép cài gói thì chạy thẳng: `npm install`, rồi `npm run dev`.

## Kiểm tra

```bash
docker compose exec web npm run typecheck   # kiểm kiểu TypeScript
docker compose exec web npm run lint        # ESLint
docker compose exec web npm test            # Vitest (logic + truy cập dữ liệu)
docker compose exec web npm run build       # bản production
```

## Công nghệ

| Phần | Dùng |
|---|---|
| Khung | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Giao diện | Tailwind CSS v4. Màu, bo góc khai trong `src/app/globals.css` (`@theme`) |
| Chuyển động | Motion |
| Icon | lucide-react |
| Lưu dữ liệu | IndexedDB qua Dexie (`src/lib/db.ts`), đọc trực tiếp bằng `useLiveQuery` |
| Lịch ôn từ | ts-fsrs, thuật toán lặp lại ngắt quãng FSRS (`src/lib/srs.ts`) |
| Âm thanh | Giọng đọc có sẵn của trình duyệt (`src/lib/tts.ts`) |
| Kiểm thử | Vitest + fake-indexeddb |
| Cài lên điện thoại | Web app manifest + service worker (`public/sw.js`, chỉ bật ở bản production) |

## Cấu trúc

```
src/
  app/            route: / (Hôm nay), /learn, /vocab, /practice, /mistakes, /progress
  components/     giao diện, chia theo màn + ui/ dùng chung
  content/        từ vựng và câu hỏi (tự soạn, có kiểu dữ liệu)
  lib/            logic thuần (session, srs, dictation, streak, dates) + repo.ts (đọc/ghi DB)
```

- **Logic thuần** nằm trong `lib/`, không phụ thuộc React, mỗi file có test cạnh bên (`*.test.ts`).
- **Mọi thao tác ghi dữ liệu** đi qua `lib/repo.ts`, gói trong transaction. Component không gọi Dexie để ghi.
- **Tiến độ chỉ nằm trên trình duyệt.** Chuyển sang máy khác: vào Tiến độ → Xuất file, rồi Nhập file ở máy kia.

## Cài lên điện thoại

Deploy lên host có `https` (Vercel là nhanh nhất: import repo, không cần cấu hình). Mở link bằng điện thoại, rồi chọn "Thêm vào màn hình chính".

## Còn làm tiếp

- Part 1 (tranh), Part 3–4 (hội thoại, bài nói), Part 6–7 (đọc hiểu)
- Thi thử có bấm giờ và ước lượng điểm
- Bài ngữ pháp ngắn
- Mở rộng từ vựng theo bộ NGSL / TSL (giấy phép CC BY-SA 4.0, nhớ ghi nguồn)
