function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Seeded random for consistent data
function seeded(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return Math.floor(r * (max - min + 1)) + min;
}

export interface DailyVisit {
  date: string;
  visitors: number;
  pageViews: number;
  uniqueVisitors: number;
}

export interface ProjectStat {
  id: string;
  title: string;
  views: number;
  downloads: number;
  avgTimeOnPage: string;
}

export interface TrafficSource {
  name: string;
  value: number;
  fill: string;
}

export interface HourlyData {
  hour: string;
  visitors: number;
}

export interface CountryStat {
  country: string;
  flag: string;
  visitors: number;
  percentage: number;
}

export const DAILY_VISITS: DailyVisit[] = Array.from({ length: 30 }, (_, i) => {
  const seed = i + 100;
  const v = seeded(seed, 80, 380);
  return {
    date: daysAgo(29 - i),
    visitors: v,
    pageViews: Math.floor(v * seeded(seed + 1, 15, 28) / 10),
    uniqueVisitors: Math.floor(v * seeded(seed + 2, 6, 9) / 10),
  };
});

export const PROJECT_STATS: ProjectStat[] = [
  { id: "neural-pcb", title: "Neural PCB Controller", views: 1847, downloads: 234, avgTimeOnPage: "4:32" },
  { id: "ros2-rover", title: "ROS2 Autonomous Rover", views: 2341, downloads: 187, avgTimeOnPage: "5:14" },
  { id: "stm32-fc", title: "STM32 Flight Controller", views: 1523, downloads: 312, avgTimeOnPage: "3:58" },
  { id: "power-management-pcb", title: "Power Management PCB", views: 987, downloads: 143, avgTimeOnPage: "3:21" },
  { id: "can-analyzer", title: "CAN Bus Analyzer", views: 1204, downloads: 267, avgTimeOnPage: "4:07" },
  { id: "soft-gripper", title: "Soft Robotic Gripper", views: 743, downloads: 89, avgTimeOnPage: "2:45" },
];

export const TRAFFIC_SOURCES: TrafficSource[] = [
  { name: "Organic Search", value: 42, fill: "hsl(188 86% 53%)" },
  { name: "Direct", value: 28, fill: "hsl(271 80% 70%)" },
  { name: "Social Media", value: 18, fill: "hsl(38 92% 60%)" },
  { name: "Referral", value: 12, fill: "hsl(142 70% 50%)" },
];

export const HOURLY_DATA: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  visitors: i < 6 ? seeded(i + 200, 5, 20)
    : i < 9 ? seeded(i + 200, 30, 80)
    : i < 12 ? seeded(i + 200, 100, 200)
    : i < 14 ? seeded(i + 200, 150, 280)
    : i < 18 ? seeded(i + 200, 120, 220)
    : i < 21 ? seeded(i + 200, 80, 160)
    : seeded(i + 200, 20, 60),
}));

export const COUNTRY_STATS: CountryStat[] = [
  { country: "United States", flag: "🇺🇸", visitors: 2841, percentage: 34.2 },
  { country: "Germany", flag: "🇩🇪", visitors: 1203, percentage: 14.5 },
  { country: "Saudi Arabia", flag: "🇸🇦", visitors: 987, percentage: 11.9 },
  { country: "United Kingdom", flag: "🇬🇧", visitors: 734, percentage: 8.8 },
  { country: "Egypt", flag: "🇪🇬", visitors: 621, percentage: 7.5 },
  { country: "Japan", flag: "🇯🇵", visitors: 489, percentage: 5.9 },
  { country: "Other", flag: "🌍", visitors: 1430, percentage: 17.2 },
];

export const TOTAL_STATS = {
  totalVisitors: DAILY_VISITS.reduce((s, d) => s + d.visitors, 0),
  totalPageViews: DAILY_VISITS.reduce((s, d) => s + d.pageViews, 0),
  totalDownloads: PROJECT_STATS.reduce((s, p) => s + p.downloads, 0),
  avgSessionDuration: "4:12",
  bounceRate: "34.8%",
  newVisitorsRate: "61.2%",
};
