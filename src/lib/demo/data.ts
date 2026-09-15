import type {
  AttendanceStatus,
  EventType,
  FeeStatus,
  MatchStatus,
  MatchType,
  NotificationType,
  Role,
  RsvpStatus,
  SkillLevel,
} from "@prisma/client";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function nextWeekday(weekday: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const diff = (weekday + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

const now = new Date();

const memberSeeds = [
  { id: "user_admin", email: "admin@pbwisdom.local", name: "Andi Wijaya", nick: "Andi", role: "ADMIN" as Role, skill: "ADVANCED" as SkillLevel, phone: "081234567890" },
  { id: "user_member", email: "member@pbwisdom.local", name: "Budi Santoso", nick: "Budi", role: "MEMBER" as Role, skill: "INTERMEDIATE" as SkillLevel, phone: "081298765432" },
  { id: "user_pending", email: "pending@pbwisdom.local", name: "Citra Dewi", nick: "Citra", role: "PENDING" as Role, skill: "BEGINNER" as SkillLevel, phone: "081211122233" },
  { id: "user_dedi", email: "dedi@pbwisdom.local", name: "Dedi Pratama", nick: "Dedi", role: "MEMBER" as Role, skill: "ADVANCED" as SkillLevel, phone: "08121000001" },
  { id: "user_eka", email: "eka@pbwisdom.local", name: "Eka Putri", nick: "Eka", role: "MEMBER" as Role, skill: "INTERMEDIATE" as SkillLevel, phone: "08121000002" },
  { id: "user_fajar", email: "fajar@pbwisdom.local", name: "Fajar Hidayat", nick: "Fajar", role: "MEMBER" as Role, skill: "INTERMEDIATE" as SkillLevel, phone: "08121000003" },
  { id: "user_gita", email: "gita@pbwisdom.local", name: "Gita Sari", nick: "Gita", role: "MEMBER" as Role, skill: "BEGINNER" as SkillLevel, phone: "08121000004" },
  { id: "user_hendra", email: "hendra@pbwisdom.local", name: "Hendra Gunawan", nick: "Hendra", role: "MEMBER" as Role, skill: "ADVANCED" as SkillLevel, phone: "08121000005" },
  { id: "user_indah", email: "indah@pbwisdom.local", name: "Indah Lestari", nick: "Indah", role: "MEMBER" as Role, skill: "INTERMEDIATE" as SkillLevel, phone: "08121000006" },
  { id: "user_joko", email: "joko@pbwisdom.local", name: "Joko Susilo", nick: "Joko", role: "MEMBER" as Role, skill: "BEGINNER" as SkillLevel, phone: "08121000007" },
  { id: "user_kartika", email: "kartika@pbwisdom.local", name: "Kartika Ayu", nick: "Kartika", role: "MEMBER" as Role, skill: "INTERMEDIATE" as SkillLevel, phone: "08121000008" },
  { id: "user_leo", email: "leo@pbwisdom.local", name: "Leo Tan", nick: "Leo", role: "MEMBER" as Role, skill: "ADVANCED" as SkillLevel, phone: "08121000009" },
  { id: "user_maya", email: "maya@pbwisdom.local", name: "Maya Ong", nick: "Maya", role: "MEMBER" as Role, skill: "BEGINNER" as SkillLevel, phone: "08121000010" },
];

export type DemoUser = {
  id: string;
  email: string;
  name: string;
  image: string;
  role: Role;
  locale: string;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemoProfile = {
  id: string;
  userId: string;
  nickname: string;
  phone: string | null;
  imageUrl: string | null;
  skill: SkillLevel;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function buildUsers() {
  const users: DemoUser[] = [];
  const profiles: DemoProfile[] = [];
  for (const m of memberSeeds) {
    users.push({
      id: m.id,
      email: m.email,
      name: m.name,
      image: avatar(m.nick),
      role: m.role,
      locale: "id",
      passwordHash: null,
      createdAt: new Date("2026-01-15"),
      updatedAt: now,
    });
    profiles.push({
      id: `profile_${m.id}`,
      userId: m.id,
      nickname: m.nick,
      phone: m.phone,
      imageUrl: avatar(m.nick),
      skill: m.skill,
      status: "ACTIVE",
      notes: m.role === "ADMIN" ? "Club admin / bendahara" : null,
      createdAt: new Date("2026-01-15"),
      updatedAt: now,
    });
  }
  return { users, profiles };
}

const { users, profiles } = buildUsers();
const activeMembers = users.filter((u) => u.role === "MEMBER" || u.role === "ADMIN");

const tueDate = nextWeekday(2);
const satDate = nextWeekday(6);

const trainingSessions = [
  {
    id: "sess_tue",
    title: "Latihan Selasa",
    weekday: 2,
    startTime: "19:00",
    endTime: "21:00",
    venue: "GOR Merdeka Medan",
    notes: "Bawa shuttle sendiri jika bisa",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sess_sat",
    title: "Latihan Sabtu",
    weekday: 6,
    startTime: "16:00",
    endTime: "18:00",
    venue: "GOR Unimed",
    notes: null as string | null,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

const trainingOccurrences = [
  {
    id: "occ_tue",
    sessionId: "sess_tue",
    date: tueDate,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "occ_sat",
    sessionId: "sess_sat",
    date: satDate,
    createdAt: now,
    updatedAt: now,
  },
];

const sessionAttendances = [
  ...activeMembers.slice(0, 8).map((u, i) => ({
    id: `att_tue_${u.id}`,
    occurrenceId: "occ_tue",
    userId: u.id,
    status: (i % 5 === 0 ? "MAYBE" : "GOING") as AttendanceStatus,
    createdAt: now,
    updatedAt: now,
  })),
  ...activeMembers.slice(0, 6).map((u) => ({
    id: `att_sat_${u.id}`,
    occurrenceId: "occ_sat",
    userId: u.id,
    status: "GOING" as AttendanceStatus,
    createdAt: now,
    updatedAt: now,
  })),
];

const feePeriods = [
  {
    id: "fee_aug",
    label: "Agustus 2026",
    amount: 150000,
    dueDate: new Date("2026-08-10"),
    paymentInstructions: "BCA 1234567890 a.n. PB Wisdom\nQRIS: lihat grup WA",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "fee_sep",
    label: "September 2026",
    amount: 150000,
    dueDate: new Date("2026-09-10"),
    paymentInstructions: "BCA 1234567890 a.n. PB Wisdom\nQRIS: lihat grup WA",
    createdAt: now,
    updatedAt: now,
  },
];

const feeStatuses: FeeStatus[] = [
  "VERIFIED",
  "SUBMITTED",
  "UNPAID",
  "REJECTED",
  "VERIFIED",
  "VERIFIED",
  "UNPAID",
  "SUBMITTED",
  "VERIFIED",
  "UNPAID",
  "VERIFIED",
  "VERIFIED",
];

const feeDues = activeMembers.flatMap((u, i) => {
  const status = feeStatuses[i % feeStatuses.length];
  return [
    {
      id: `due_aug_${u.id}`,
      periodId: "fee_aug",
      userId: u.id,
      status: "VERIFIED" as FeeStatus,
      proofUrl: "https://placehold.co/400x600/png?text=Bukti+Aug",
      submittedAt: new Date("2026-08-08"),
      verifiedById: "user_admin",
      verifiedAt: new Date("2026-08-12"),
      rejectReason: null as string | null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `due_sep_${u.id}`,
      periodId: "fee_sep",
      userId: u.id,
      status,
      proofUrl:
        status === "UNPAID"
          ? null
          : "https://placehold.co/400x600/png?text=Bukti+Sep",
      submittedAt: status === "UNPAID" ? null : new Date("2026-09-05"),
      verifiedById: status === "VERIFIED" ? "user_admin" : null,
      verifiedAt: status === "VERIFIED" ? new Date("2026-09-06") : null,
      rejectReason: status === "REJECTED" ? "Nominal kurang / blur" : null,
      createdAt: now,
      updatedAt: now,
    },
  ];
});

const events = [
  {
    id: "event_sparring",
    title: "Sparring Internal Wisdom",
    type: "SPARRING" as EventType,
    startsAt: new Date("2026-09-14T16:00:00"),
    endsAt: new Date("2026-09-14T19:00:00"),
    location: "GOR Merdeka Medan",
    capacity: 24,
    notes: "Format mix doubles + singles",
    extraFee: null as number | null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "event_gathering",
    title: "Gathering Ulang Tahun Club",
    type: "GATHERING" as EventType,
    startsAt: new Date("2026-09-20T18:00:00"),
    endsAt: null as Date | null,
    location: "Cafe Shuttle Medan",
    capacity: 40,
    notes: null as string | null,
    extraFee: 50000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "event_past",
    title: "Friendly vs Medan Smashers",
    type: "TOURNAMENT" as EventType,
    startsAt: new Date("2026-08-24T15:00:00"),
    endsAt: new Date("2026-08-24T20:00:00"),
    location: "GOR Unimed",
    capacity: 16,
    notes: null as string | null,
    extraFee: null as number | null,
    createdAt: now,
    updatedAt: now,
  },
];

const eventRsvps = [
  ...activeMembers.slice(0, 10).map((u) => ({
    id: `rsvp_sparring_${u.id}`,
    eventId: "event_sparring",
    userId: u.id,
    status: "GOING" as RsvpStatus,
    attended: false,
    createdAt: now,
    updatedAt: now,
  })),
  ...activeMembers.slice(0, 8).map((u) => ({
    id: `rsvp_gathering_${u.id}`,
    eventId: "event_gathering",
    userId: u.id,
    status: "GOING" as RsvpStatus,
    attended: false,
    createdAt: now,
    updatedAt: now,
  })),
  ...activeMembers.slice(0, 12).map((u) => ({
    id: `rsvp_past_${u.id}`,
    eventId: "event_past",
    userId: u.id,
    status: "GOING" as RsvpStatus,
    attended: true,
    createdAt: now,
    updatedAt: now,
  })),
];

const eventPhotos = [
  {
    id: "photo_1",
    eventId: "event_past",
    uploaderId: activeMembers[0].id,
    imageUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
    caption: "Momen #1",
    createdAt: new Date("2026-08-24T20:30:00"),
    updatedAt: now,
  },
  {
    id: "photo_2",
    eventId: "event_past",
    uploaderId: activeMembers[1].id,
    imageUrl:
      "https://images.unsplash.com/photo-1613918431703-aa507d7208c9?w=800&q=80",
    caption: "Momen #2",
    createdAt: new Date("2026-08-24T20:35:00"),
    updatedAt: now,
  },
  {
    id: "photo_3",
    eventId: "event_past",
    uploaderId: activeMembers[2]?.id ?? activeMembers[0].id,
    imageUrl:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f1?w=800&q=80",
    caption: "Momen #3",
    createdAt: new Date("2026-08-24T20:40:00"),
    updatedAt: now,
  },
  {
    id: "photo_4",
    eventId: "event_sparring",
    uploaderId: "user_admin",
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
    caption: "Court siap",
    createdAt: new Date("2026-09-10T10:00:00"),
    updatedAt: now,
  },
];

type MatchSeed = {
  id: string;
  type: MatchType;
  status: MatchStatus;
  score: string;
  playedAt: Date;
  loggedById: string;
  eventId: string | null;
  players: {
    id: string;
    userId: string;
    team: number;
    confirmed: boolean;
    won: boolean | null;
  }[];
};

const matchPairs: [number, number, string, boolean][] = [
  [0, 1, "21-18, 19-21, 21-15", true],
  [0, 2, "21-12, 21-16", true],
  [1, 3, "21-19, 18-21, 21-17", true],
  [2, 4, "15-21, 21-19, 19-21", false],
  [3, 5, "21-14, 21-18", true],
  [4, 6, "21-21, 21-19", true],
  [5, 7, "19-21, 21-15, 21-13", true],
  [0, 4, "21-16, 21-18", true],
  [1, 5, "18-21, 21-19, 15-21", false],
  [2, 6, "21-10, 21-14", true],
];

const matches: MatchSeed[] = matchPairs.map(([a, b, score, aWon], i) => {
  const pA = activeMembers[a];
  const pB = activeMembers[b];
  return {
    id: `match_${i + 1}`,
    type: "SINGLES" as MatchType,
    status: "CONFIRMED" as MatchStatus,
    score,
    playedAt: new Date(Date.now() - (i + 1) * 2 * 86400000),
    loggedById: pA.id,
    eventId: a < 3 ? "event_past" : null,
    players: [
      {
        id: `mp_${i + 1}_a`,
        userId: pA.id,
        team: 1,
        confirmed: true,
        won: aWon,
      },
      {
        id: `mp_${i + 1}_b`,
        userId: pB.id,
        team: 2,
        confirmed: true,
        won: !aWon,
      },
    ],
  };
});

matches.push({
  id: "match_doubles",
  type: "DOUBLES",
  status: "CONFIRMED",
  score: "21-17, 21-19",
  playedAt: new Date(Date.now() - 3 * 86400000),
  loggedById: "user_admin",
  eventId: null,
  players: [
    { id: "mp_d_1", userId: activeMembers[0].id, team: 1, confirmed: true, won: true },
    { id: "mp_d_2", userId: activeMembers[1].id, team: 1, confirmed: true, won: true },
    { id: "mp_d_3", userId: activeMembers[2].id, team: 2, confirmed: true, won: false },
    { id: "mp_d_4", userId: activeMembers[3].id, team: 2, confirmed: true, won: false },
  ],
});

matches.push({
  id: "match_pending",
  type: "SINGLES",
  status: "PENDING",
  score: "21-19, 18-21, 21-16",
  playedAt: new Date(),
  loggedById: "user_dedi",
  eventId: null,
  players: [
    {
      id: "mp_pend_member",
      userId: "user_member",
      team: 1,
      confirmed: false,
      won: true,
    },
    {
      id: "mp_pend_dedi",
      userId: "user_dedi",
      team: 2,
      confirmed: true,
      won: false,
    },
  ],
});

const matchPlayers = matches.flatMap((m) =>
  m.players.map((p) => ({
    ...p,
    matchId: m.id,
    createdAt: now,
    updatedAt: now,
  })),
);

const matchRows = matches.map(({ players: _p, ...m }) => ({
  ...m,
  createdAt: now,
  updatedAt: now,
}));

const announcements = [
  {
    id: "ann_1",
    title: "Ganti lapangan Sabtu ini",
    body: "Latihan Sabtu pindah sementara ke GOR Unimed karena Merdeka booked. Datang 15 menit lebih awal ya!",
    createdById: "user_admin",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: now,
  },
];

const notifications = [
  {
    id: "notif_1",
    userId: "user_member",
    type: "IURAN" as NotificationType,
    title: "Iuran September dibuka",
    body: "Silakan transfer Rp150.000 dan upload bukti.",
    href: "/profile/iuran",
    read: false,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: now,
  },
  {
    id: "notif_2",
    userId: "user_member",
    type: "MATCH" as NotificationType,
    title: "Konfirmasi hasil match",
    body: "Dedi mencatat match melawanmu — konfirmasi skor.",
    href: "/play",
    read: false,
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: now,
  },
  {
    id: "notif_3",
    userId: "user_member",
    type: "ANNOUNCEMENT" as NotificationType,
    title: "Ganti lapangan Sabtu ini",
    body: "Lihat pengumuman terbaru di Home.",
    href: "/",
    read: true,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: now,
  },
  {
    id: "notif_admin_1",
    userId: "user_admin",
    type: "IURAN" as NotificationType,
    title: "2 bukti iuran menunggu",
    body: "Ada transfer yang perlu diverifikasi.",
    href: "/club/iuran",
    read: false,
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: now,
  },
];

const invites = [
  {
    id: "invite_1",
    code: "WISDOM2026",
    type: "CLUB",
    remainingUses: 100,
    autoApprove: false,
    createdById: "user_admin",
    createdAt: now,
    updatedAt: now,
  },
];

export const demoStore = {
  user: users,
  memberProfile: profiles,
  trainingSession: trainingSessions,
  trainingOccurrence: trainingOccurrences,
  sessionAttendance: sessionAttendances,
  feePeriod: feePeriods,
  feeDue: feeDues,
  event: events,
  eventRsvp: eventRsvps,
  eventPhoto: eventPhotos,
  match: matchRows,
  matchPlayer: matchPlayers,
  announcement: announcements,
  notification: notifications,
  invite: invites,
};

export type DemoModel = keyof typeof demoStore;

export function getDemoUserByRole(role: "MEMBER" | "ADMIN") {
  return role === "ADMIN"
    ? users.find((u) => u.id === "user_admin")!
    : users.find((u) => u.id === "user_member")!;
}
