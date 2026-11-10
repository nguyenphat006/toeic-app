import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TOEIC Xanh — luyện Nghe + Đọc",
    short_name: "TOEIC Xanh",
    description: "Tự học TOEIC Nghe + Đọc mỗi ngày 15 phút.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f8f1",
    theme_color: "#2f8f4e",
    lang: "vi",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
