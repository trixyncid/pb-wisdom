import { PrismaClient, Role, SkillLevel, FeeStatus, MatchType, MatchStatus, EventType, RsvpStatus, AttendanceStatus, NotificationType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

async function main() {
  console.log("Seeding PB Wisdom club…");

  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.match.deleteMany();
  await prisma.eventPhoto.deleteMany();
  await prisma.eventRsvp.deleteMany();
  await prisma.event.deleteMany();
  await prisma.sessionAttendance.deleteMany();
  await prisma.trainingOccurrence.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.feeDue.deleteMany();
  await prisma.feePeriod.deleteMany();
  await prisma.memberProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await hash("WisdomAdmin1!", 10);
  const memberHash = await hash("WisdomMember1!", 10);
  const pendingHash = await hash("WisdomPending1!", 10);
  const dummyHash = await hash("WisdomMember1!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@pbwisdom.local",
      name: "Andi Wijaya",
      passwordHash: adminHash,
      role: Role.ADMIN,
      locale: "id",
      image: avatar("Andi"),
      profile: {
        create: {
          nickname: "Andi",
          phone: "081234567890",
          imageUrl: avatar("Andi"),
          skill: SkillLevel.ADVANCED,
          notes: "Club admin / bendahara",
        },
      },
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "member@pbwisdom.local",
      name: "Budi Santoso",
      passwordHash: memberHash,
      role: Role.MEMBER,
      locale: "id",
      image: avatar("Budi"),
      profile: {
        create: {
          nickname: "Budi",
          phone: "081298765432",
          imageUrl: avatar("Budi"),
          skill: SkillLevel.INTERMEDIATE,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "pending@pbwisdom.local",
      name: "Citra Dewi",
      passwordHash: pendingHash,
      role: Role.PENDING,
      locale: "id",
      image: avatar("Citra"),
      profile: {
        create: {
          nickname: "Citra",
          phone: "081211122233",
          imageUrl: avatar("Citra"),
          skill: SkillLevel.BEGINNER,
        },
      },
    },
  });

  const dummyNames = [
    { name: "Dedi Pratama", nick: "Dedi", skill: SkillLevel.ADVANCED },
    { name: "Eka Putri", nick: "Eka", skill: SkillLevel.INTERMEDIATE },
    { name: "Fajar Hidayat", nick: "Fajar", skill: SkillLevel.INTERMEDIATE },
    { name: "Gita Sari", nick: "Gita", skill: SkillLevel.BEGINNER },
    { name: "Hendra Gunawan", nick: "Hendra", skill: SkillLevel.ADVANCED },
    { name: "Indah Lestari", nick: "Indah", skill: SkillLevel.INTERMEDIATE },
    { name: "Joko Susilo", nick: "Joko", skill: SkillLevel.BEGINNER },
    { name: "Kartika Ayu", nick: "Kartika", skill: SkillLevel.INTERMEDIATE },
    { name: "Leo Tan", nick: "Leo", skill: SkillLevel.ADVANCED },
    { name: "Maya Ong", nick: "Maya", skill: SkillLevel.BEGINNER },
  ];

  const dummies = [];
  for (let i = 0; i < dummyNames.length; i++) {
    const d = dummyNames[i];
    const u = await prisma.user.create({
      data: {
        email: `${d.nick.toLowerCase()}@pbwisdom.local`,
        name: d.name,
        passwordHash: dummyHash,
        role: Role.MEMBER,
        locale: "id",
        image: avatar(d.nick),
        profile: {
          create: {
            nickname: d.nick,
            phone: `0812${String(1000000 + i).slice(0, 7)}`,
            imageUrl: avatar(d.nick),
            skill: d.skill,
          },
        },
      },
    });
    dummies.push(u);
  }

  const allMembers = [admin, member, ...dummies];

  await prisma.invite.create({
    data: {
      code: "WISDOM2026",
      type: "CLUB",
      remainingUses: 100,
      autoApprove: false,
      createdById: admin.id,
    },
  });

  const tue = await prisma.trainingSession.create({
    data: {
      title: "Latihan Selasa",
      weekday: 2,
      startTime: "19:00",
      endTime: "21:00",
      venue: "GOR Merdeka Medan",
      notes: "Bawa shuttle sendiri jika bisa",
    },
  });

  const sat = await prisma.trainingSession.create({
    data: {
      title: "Latihan Sabtu",
      weekday: 6,
      startTime: "16:00",
      endTime: "18:00",
      venue: "GOR Unimed",
    },
  });

  const nextTue = nextWeekday(2);
  const nextSat = nextWeekday(6);

  const occTue = await prisma.trainingOccurrence.create({
    data: { sessionId: tue.id, date: nextTue },
  });
  const occSat = await prisma.trainingOccurrence.create({
    data: { sessionId: sat.id, date: nextSat },
  });

  for (const [i, u] of allMembers.slice(0, 8).entries()) {
    await prisma.sessionAttendance.create({
      data: {
        occurrenceId: occTue.id,
        userId: u.id,
        status: i % 5 === 0 ? AttendanceStatus.MAYBE : AttendanceStatus.GOING,
      },
    });
  }

  for (const u of allMembers.slice(0, 6)) {
    await prisma.sessionAttendance.create({
      data: {
        occurrenceId: occSat.id,
        userId: u.id,
        status: AttendanceStatus.GOING,
      },
    });
  }

  const lastMonth = await prisma.feePeriod.create({
    data: {
      label: "Agustus 2026",
      amount: 150000,
      dueDate: new Date("2026-08-10"),
      paymentInstructions: "BCA 1234567890 a.n. PB Wisdom\nQRIS: lihat grup WA",
    },
  });

  const thisMonth = await prisma.feePeriod.create({
    data: {
      label: "September 2026",
      amount: 150000,
      dueDate: new Date("2026-09-10"),
      paymentInstructions: "BCA 1234567890 a.n. PB Wisdom\nQRIS: lihat grup WA",
    },
  });

  const statuses: FeeStatus[] = [
    FeeStatus.VERIFIED,
    FeeStatus.SUBMITTED,
    FeeStatus.UNPAID,
    FeeStatus.REJECTED,
    FeeStatus.VERIFIED,
    FeeStatus.VERIFIED,
    FeeStatus.UNPAID,
    FeeStatus.SUBMITTED,
    FeeStatus.VERIFIED,
    FeeStatus.UNPAID,
    FeeStatus.VERIFIED,
    FeeStatus.VERIFIED,
  ];

  for (let i = 0; i < allMembers.length; i++) {
    const status = statuses[i % statuses.length];
    await prisma.feeDue.create({
      data: {
        periodId: lastMonth.id,
        userId: allMembers[i].id,
        status: FeeStatus.VERIFIED,
        verifiedById: admin.id,
        verifiedAt: new Date("2026-08-12"),
        submittedAt: new Date("2026-08-08"),
        proofUrl: "https://placehold.co/400x600/png?text=Bukti+Aug",
      },
    });
    await prisma.feeDue.create({
      data: {
        periodId: thisMonth.id,
        userId: allMembers[i].id,
        status,
        proofUrl:
          status === FeeStatus.UNPAID
            ? null
            : "https://placehold.co/400x600/png?text=Bukti+Sep",
        submittedAt:
          status === FeeStatus.UNPAID ? null : new Date("2026-09-05"),
        verifiedById: status === FeeStatus.VERIFIED ? admin.id : null,
        verifiedAt: status === FeeStatus.VERIFIED ? new Date("2026-09-06") : null,
        rejectReason:
          status === FeeStatus.REJECTED ? "Nominal kurang / blur" : null,
      },
    });
  }

  const sparring = await prisma.event.create({
    data: {
      title: "Sparring Internal Wisdom",
      type: EventType.SPARRING,
      startsAt: new Date("2026-09-14T16:00:00"),
      endsAt: new Date("2026-09-14T19:00:00"),
      location: "GOR Merdeka Medan",
      capacity: 24,
      notes: "Format mix doubles + singles",
    },
  });

  const gathering = await prisma.event.create({
    data: {
      title: "Gathering Ulang Tahun Club",
      type: EventType.GATHERING,
      startsAt: new Date("2026-09-20T18:00:00"),
      location: "Cafe Shuttle Medan",
      capacity: 40,
      extraFee: 50000,
    },
  });

  const pastEvent = await prisma.event.create({
    data: {
      title: "Friendly vs Medan Smashers",
      type: EventType.TOURNAMENT,
      startsAt: new Date("2026-08-24T15:00:00"),
      endsAt: new Date("2026-08-24T20:00:00"),
      location: "GOR Unimed",
      capacity: 16,
    },
  });

  for (const u of allMembers.slice(0, 10)) {
    await prisma.eventRsvp.create({
      data: { eventId: sparring.id, userId: u.id, status: RsvpStatus.GOING },
    });
  }
  for (const u of allMembers.slice(0, 8)) {
    await prisma.eventRsvp.create({
      data: { eventId: gathering.id, userId: u.id, status: RsvpStatus.GOING },
    });
  }
  for (const u of allMembers.slice(0, 12)) {
    await prisma.eventRsvp.create({
      data: {
        eventId: pastEvent.id,
        userId: u.id,
        status: RsvpStatus.GOING,
        attended: true,
      },
    });
  }

  const photoUrls = [
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
    "https://images.unsplash.com/photo-1613918431703-aa507d7208c9?w=800&q=80",
    "https://images.unsplash.com/photo-1599487488170-d11ec9c172f1?w=800&q=80",
  ];

  for (let i = 0; i < photoUrls.length; i++) {
    await prisma.eventPhoto.create({
      data: {
        eventId: pastEvent.id,
        uploaderId: allMembers[i].id,
        imageUrl: photoUrls[i],
        caption: `Momen #${i + 1}`,
      },
    });
  }
  await prisma.eventPhoto.create({
    data: {
      eventId: sparring.id,
      uploaderId: admin.id,
      imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
      caption: "Court siap",
    },
  });

  // Matches for leaderboard
  const pairs: [number, number, string, boolean][] = [
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

  for (const [a, b, score, aWon] of pairs) {
    const pA = allMembers[a];
    const pB = allMembers[b];
    await prisma.match.create({
      data: {
        type: MatchType.SINGLES,
        status: MatchStatus.CONFIRMED,
        score,
        playedAt: new Date(Date.now() - Math.random() * 20 * 86400000),
        loggedById: pA.id,
        eventId: a < 3 ? pastEvent.id : null,
        players: {
          create: [
            { userId: pA.id, team: 1, confirmed: true, won: aWon },
            { userId: pB.id, team: 2, confirmed: true, won: !aWon },
          ],
        },
      },
    });
  }

  // One doubles + one pending confirm
  await prisma.match.create({
    data: {
      type: MatchType.DOUBLES,
      status: MatchStatus.CONFIRMED,
      score: "21-17, 21-19",
      loggedById: admin.id,
      players: {
        create: [
          { userId: allMembers[0].id, team: 1, confirmed: true, won: true },
          { userId: allMembers[1].id, team: 1, confirmed: true, won: true },
          { userId: allMembers[2].id, team: 2, confirmed: true, won: false },
          { userId: allMembers[3].id, team: 2, confirmed: true, won: false },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      type: MatchType.SINGLES,
      status: MatchStatus.PENDING,
      score: "21-19, 18-21, 21-16",
      loggedById: dummies[0].id,
      players: {
        create: [
          { userId: member.id, team: 1, confirmed: false, won: true },
          { userId: dummies[0].id, team: 2, confirmed: true, won: false },
        ],
      },
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Ganti lapangan Sabtu ini",
      body: "Latihan Sabtu pindah sementara ke GOR Unimed karena Merdeka booked. Datang 15 menit lebih awal ya!",
      createdById: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        type: NotificationType.IURAN,
        title: "Iuran September dibuka",
        body: "Silakan transfer Rp150.000 dan upload bukti.",
        href: "/profile/iuran",
      },
      {
        userId: member.id,
        type: NotificationType.MATCH,
        title: "Konfirmasi hasil match",
        body: "Dedi mencatat match melawanmu — konfirmasi skor.",
        href: "/play",
      },
      {
        userId: member.id,
        type: NotificationType.ANNOUNCEMENT,
        title: "Ganti lapangan Sabtu ini",
        body: "Lihat pengumuman terbaru di Home.",
        href: "/",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin:  admin@pbwisdom.local / WisdomAdmin1!");
  console.log("Member: member@pbwisdom.local / WisdomMember1!");
  console.log("Pending: pending@pbwisdom.local / WisdomPending1!");
}

function nextWeekday(weekday: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const diff = (weekday + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
