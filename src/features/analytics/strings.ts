import type { Language, Text } from "@/features/i18n/types"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { CHURCH_TIME_ZONE } from "@/lib/churchTime";
import type { AnalyticsEvent, PageStats, PathStats, PersonStats, Range, Service, UsageStats } from "./types";

// Every word this feature shows a user, in both languages. The dashboard is an admin's, but follows the same rule.
export const STRINGS = {
  heading: { en: "App usage", vi: "Cách dùng ứng dụng" } satisfies Text,
  open: { en: "Usage, speed and problems", vi: "Cách dùng, tốc độ và vấn đề" } satisfies Text,
  period: { en: "Period", vi: "Khoảng thời gian" } satisfies Text,
  totals: { en: "Totals", vi: "Tổng cộng" } satisfies Text,
  actions: { en: "Prayer and music", vi: "Cầu nguyện và nhạc" } satisfies Text,
  people: { en: "People", vi: "Số người" } satisfies Text,
  visits: { en: "Visits", vi: "Lượt vào" } satisfies Text,
  views: { en: "Screens opened", vi: "Màn hình đã mở" } satisfies Text,
  timeSpent: { en: "Time in the app", vi: "Thời gian dùng" } satisfies Text,
  errors: { en: "Errors", vi: "Lỗi" } satisfies Text,
  slow: { en: "Slow requests", vi: "Yêu cầu chậm" } satisfies Text,
  closer: { en: "Look closer", vi: "Xem chi tiết" } satisfies Text,
  pagesView: { en: "Screens", vi: "Màn hình" } satisfies Text,
  peopleView: { en: "People", vi: "Mọi người" } satisfies Text,
  pathsView: { en: "What opens what", vi: "Đi từ đâu đến đâu" } satisfies Text,
  problemsView: { en: "Problems", vi: "Vấn đề" } satisfies Text,
  usageView: { en: "Resources per visit", vi: "Tài nguyên mỗi lượt vào" } satisfies Text,
  slowHeading: { en: "Slow requests (3 s or more)", vi: "Yêu cầu chậm (từ 3 giây)" } satisfies Text,
  repeatedHeading: { en: "Tapped again and again", vi: "Bấm nhiều lần liên tục" } satisfies Text,
  vitalsHeading: { en: "Page speed (Google's measures)", vi: "Tốc độ trang (theo Google)" } satisfies Text,
  nothing: { en: "Nothing recorded in this period.", vi: "Chưa ghi nhận gì trong khoảng này." } satisfies Text,
  unknown: { en: "Unknown", vi: "Không rõ" } satisfies Text,
};

export const RANGE_NAMES: Record<Range, Text> = {
  1: { en: "Last 24 hours", vi: "24 giờ qua" },
  7: { en: "Last 7 days", vi: "7 ngày qua" },
  30: { en: "Last 30 days", vi: "30 ngày qua" },
};

export const SERVICE_NAMES: Record<Service, Text> = {
  database: { en: "Database", vi: "Cơ sở dữ liệu" },
  storage: { en: "Pictures and files", vi: "Hình và tệp" },
  auth: { en: "Sign-in", vi: "Đăng nhập" },
  functions: { en: "Functions", vi: "Hàm" },
  api: { en: "App's server", vi: "Máy chủ ứng dụng" },
  files: { en: "App's code and pictures", vi: "Mã và hình của ứng dụng" },
};

export const VITAL_NAMES: Partial<Record<string, Text>> = {
  LCP: { en: "Main content shown", vi: "Nội dung chính hiện ra" },
  INP: { en: "Answer to a tap", vi: "Phản hồi khi bấm" },
  CLS: { en: "Things jumping", vi: "Bố cục bị nhảy" },
  TTFB: { en: "Server's first answer", vi: "Máy chủ trả lời lần đầu" },
};

const join = (...parts: (string | false | null)[]) => parts.filter(Boolean).join(" · ");

// "0.4 s", "12 s", "3 min 20 s", "2 h 5 min".
export function duration(ms: number): Text {
  const seconds = ms / 1000;
  if (seconds < 10) return { en: `${seconds.toFixed(1)} s`, vi: `${seconds.toFixed(1)} giây` };
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (minutes < 1) return { en: `${Math.round(seconds)} s`, vi: `${Math.round(seconds)} giây` };
  if (hours < 1) {
    const rest = Math.round(seconds % 60);
    return { en: `${minutes} min ${rest} s`, vi: `${minutes} phút ${rest} giây` };
  }
  return { en: `${hours} h ${minutes % 60} min`, vi: `${hours} giờ ${minutes % 60} phút` };
}

// "240 KB", "1.2 MB": the same in both languages.
export function size(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// A moment, as the church's clock shows it.
export function when(iso: string, language: Language): string {
  return new Date(iso).toLocaleString(LOCALES[language], { dateStyle: "medium", timeStyle: "short", timeZone: CHURCH_TIME_ZONE });
}

export function pageSummary(row: PageStats): Text {
  const each = duration(row.views > 0 ? row.total_ms / row.views : 0);
  const wait = row.p75_wait_ms === null ? null : duration(row.p75_wait_ms);
  return {
    en: join(`${row.views} opens`, `${row.people} people`, `${each.en} each`, wait && `ready in ${wait.en}`, row.errors > 0 && `${row.errors} errors`),
    vi: join(`${row.views} lượt mở`, `${row.people} người`, `mỗi lượt ${each.vi}`, wait && `hiện ra sau ${wait.vi}`, row.errors > 0 && `${row.errors} lỗi`),
  };
}

export function personSummary(row: PersonStats): Text {
  const time = duration(row.total_ms);
  return {
    en: join(`${row.visits} visits`, `${row.views} screens`, time.en, row.errors > 0 && `${row.errors} errors`),
    vi: join(`${row.visits} lượt vào`, `${row.views} màn hình`, time.vi, row.errors > 0 && `${row.errors} lỗi`),
  };
}

export function pathSummary(row: PathStats): Text {
  return {
    en: join(row.via && `tapped “${row.via}”`, `${row.times} times`),
    vi: join(row.via && `bấm “${row.via}”`, `${row.times} lần`),
  };
}

// The names of the actions buttons are marked with (`data-action`); one not listed here shows as it is.
const ACTION_NAMES: Record<string, Text> = {
  pray: { en: "Prayed for a request", vi: "Cầu nguyện cho một ý" },
  "music-play": { en: "Played the music", vi: "Phát nhạc" },
  "music-pause": { en: "Paused the music", vi: "Tạm dừng nhạc" },
  "music-next": { en: "Next song", vi: "Bài kế tiếp" },
  "music-previous": { en: "Previous song", vi: "Bài trước" },
};

export function actionName(action: string): Text {
  return ACTION_NAMES[action] ?? { en: action, vi: action };
}

export function timesAndPeople(times: number, people: number): Text {
  return { en: `${times} times · ${people} people`, vi: `${times} lần · ${people} người` };
}

export function slowSummary(times: number, p75Ms: number, maxMs: number): Text {
  const typical = duration(p75Ms);
  const worst = duration(maxMs);
  return {
    en: `${times} times · usually ${typical.en} · at worst ${worst.en}`,
    vi: `${times} lần · thường ${typical.vi} · lâu nhất ${worst.vi}`,
  };
}

export function repeatedSummary(times: number, visits: number): Text {
  return { en: `${times} repeated taps in ${visits} visits`, vi: `${times} lần bấm lại trong ${visits} lượt vào` };
}

// A measure's p75: CLS is a score (stored × 1000), the others are times.
export function vitalSummary(name: string, p75: number, readings: number, poor: number): Text {
  const value = name === "CLS" ? { en: (p75 / 1000).toFixed(2), vi: (p75 / 1000).toFixed(2) } : duration(p75);
  return {
    en: `usually ${value.en} · ${poor} of ${readings} poor`,
    vi: `thường ${value.vi} · ${poor}/${readings} kém`,
  };
}

export function usageSummary(row: UsageStats): Text {
  const visits = Math.max(row.visits, 1);
  const waiting = duration(row.total_ms / visits);
  const requests = Math.round(row.requests / visits);
  return {
    en: join(`${requests} requests per visit`, `${waiting.en} waiting`, row.bytes > 0 && size(row.bytes / visits), `${row.visits} visits`),
    vi: join(`${requests} yêu cầu mỗi lượt`, `chờ ${waiting.vi}`, row.bytes > 0 && size(row.bytes / visits), `${row.visits} lượt vào`),
  };
}

// One line of a person's timeline.
export function describeEvent(event: AnalyticsEvent): Text {
  const ms = duration(event.ms ?? 0);
  switch (event.kind) {
    case "page":
      return { en: `On ${event.path} for ${ms.en}`, vi: `Ở ${event.path} trong ${ms.vi}` };
    case "click":
      return { en: `Tapped “${event.target}”`, vi: `Bấm “${event.target}”` };
    case "action":
      return actionName(event.target ?? "");
    case "error":
      return { en: `Error: ${event.target}`, vi: `Lỗi: ${event.target}` };
    case "slow":
      return { en: `Waited ${ms.en} for ${event.target}`, vi: `Chờ ${ms.vi} cho ${event.target}` };
    case "vital":
      return { en: `${event.target}: ${event.detail.rating}`, vi: `${event.target}: ${event.detail.rating}` };
  }
}
