import { Student, CalendarEvent, Announcement, EPermit, LiaisonEntry, CounselingRecord } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'rian',
    name: 'Rian Hidayat',
    class: 'TK-A',
    avatar: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&auto=format&fit=crop&q=80', // Kids boy portrait
    attendanceToday: 'HADIR',
    attendanceTime: '06:45 WIB',
    parentName: 'Ibu Maria',
    sppStatus: 'Belum Lunas',
    sppBills: [
      {
        id: 'bill-1',
        title: 'SPP Bulanan - Juni 2026',
        amount: 350000,
        dueDate: '10 Juli 2026',
        status: 'Unpaid'
      },
      {
        id: 'bill-2',
        title: 'Uang Kegiatan Pramuka & Outbound',
        amount: 150000,
        dueDate: '15 Juli 2026',
        status: 'Paid',
        paidAt: '20 Juni 2026'
      }
    ],
    grades: [
      { subject: 'Matematika', score: 88, maxScore: 100, type: 'Tugas', date: '18 Juni 2026' },
      { subject: 'IPA', score: 92, maxScore: 100, type: 'Tugas', date: '19 Juni 2026' },
      { subject: 'Bahasa Indonesia', score: 85, maxScore: 100, type: 'UTS', date: '10 Juni 2026' },
      { subject: 'Pancasila & Kewarganegaraan', score: 90, maxScore: 100, type: 'UTS', date: '11 Juni 2026' },
      { subject: 'IPS', score: 78, maxScore: 100, type: 'Tugas', date: '15 Juni 2026' }
    ]
  },
  {
    id: 'sasa',
    name: 'Sasa Amelia',
    class: 'TK-B',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', // Kids girl portrait
    attendanceToday: 'BELUM ABSEN',
    parentName: 'Ibu Maria',
    sppStatus: 'Lunas',
    sppBills: [
      {
        id: 'bill-3',
        title: 'SPP Bulanan - Juni 2026',
        amount: 350000,
        dueDate: '10 Juli 2026',
        status: 'Paid',
        paidAt: '25 Juni 2026'
      }
    ],
    grades: [
      { subject: 'Bahasa Indonesia', score: 95, maxScore: 100, type: 'Tugas', date: '18 Juni 2026' },
      { subject: 'Seni Budaya', score: 98, maxScore: 100, type: 'Tugas', date: '20 Juni 2026' },
      { subject: 'Matematika', score: 82, maxScore: 100, type: 'UTS', date: '12 Juni 2026' }
    ]
  },
  {
    // Additional student for class 4-A to make the teacher's dashboard look complete and populated!
    id: 'budi_jr',
    name: 'Budi Santoso',
    class: 'TK-A',
    avatar: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&auto=format&fit=crop&q=80',
    attendanceToday: 'HADIR',
    attendanceTime: '06:40 WIB',
    parentName: 'Bapak Joko',
    sppStatus: 'Lunas',
    sppBills: [],
    grades: []
  },
  {
    id: 'citra',
    name: 'Citra Kirana',
    class: 'TK-A',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    attendanceToday: 'ALFA',
    parentName: 'Ibu Rina',
    sppStatus: 'Belum Lunas',
    sppBills: [],
    grades: []
  },
  {
    id: 'dodi',
    name: 'Dodi Hermawan',
    class: 'TK-A',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    attendanceToday: 'HADIR',
    attendanceTime: '06:55 WIB',
    parentName: 'Bapak Rudi',
    sppStatus: 'Lunas',
    sppBills: [],
    grades: []
  }
];

export const INITIAL_PERMITS: EPermit[] = [
  {
    id: 'permit-1',
    studentId: 'rian',
    studentName: 'Rian Hidayat',
    className: 'TK-A',
    type: 'Sakit',
    startDate: '2026-06-26',
    endDate: '2026-06-27',
    reason: 'Sakit Demam Tinggi, butuh istirahat sesuai saran dokter.',
    attachmentName: 'SuratDokter.jpg',
    status: 'Pending',
    submittedAt: '2026-06-26T06:15:00Z'
  },
  {
    id: 'permit-2',
    studentId: 'citra',
    studentName: 'Citra Kirana',
    className: 'TK-A',
    type: 'Keperluan Keluarga',
    startDate: '2026-06-28',
    endDate: '2026-06-28',
    reason: 'Menghadiri upacara pernikahan paman di luar kota.',
    attachmentName: 'SuratUndanganKeluarga.pdf',
    status: 'Pending',
    submittedAt: '2026-06-25T18:30:00Z'
  }
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Ujian Akhir Semester (UAS)',
    date: '30 Juni 2026 s.d 4 Juli 2026',
    type: 'academic',
    description: 'Pelaksanaan evaluasi akhir semester genap tahun ajaran 2025/2026.'
  },
  {
    id: 'event-2',
    title: 'Libur Kenaikan Kelas',
    date: '6 Juli 2026 s.d 18 Juli 2026',
    type: 'holiday',
    description: 'Masa libur bagi seluruh siswa setelah menyelesaikan penilaian akhir tahun.'
  },
  {
    id: 'event-3',
    title: 'Pembagian Rapor Hasil Belajar',
    date: '5 Juli 2026',
    type: 'academic',
    description: 'Pengambilan rapor oleh wali murid di kelas masing-masing.'
  },
  {
    id: 'event-4',
    title: 'Rapat Koordinasi Wali Murid & Sekolah',
    date: '10 Juli 2026',
    type: 'event',
    description: 'Pertemuan komite sekolah membahas program kerja tahun ajaran baru.'
  }
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Edaran Libur Semester Ganjil',
    date: '15 Mei 2026',
    category: 'Akademik',
    excerpt: 'Menindaklanjuti kalender akademik sekolah, berikut kami informasikan libur akhir semester...',
    content: 'Menindaklanjuti kalender akademik sekolah Mutiara Bangsa, dengan ini diumumkan bahwa libur akhir semester ganjil akan dimulai dari tanggal 20 Desember s.d 3 Januari. Pembelajaran akan aktif kembali pada tanggal 4 Januari. Diharapkan seluruh wali murid dapat memantau kegiatan belajar mandiri siswa di rumah.'
  },
  {
    id: 'ann-2',
    title: 'Jadwal Ujian Akhir Kelas 4',
    date: '12 Mei 2026',
    category: 'Ujian',
    excerpt: 'Pelaksanaan ujian tertulis utama bagi jenjang kelas 4 akan diselenggarakan mulai senin depan...',
    content: 'Pelaksanaan ujian tertulis utama bagi jenjang kelas 4 akan diselenggarakan mulai hari Senin depan. Mata pelajaran yang diujikan meliputi Matematika, IPA, IPS, Bahasa Indonesia, dan PKn. Harap membekali anak dengan peralatan tulis yang lengkap dan menjaga kesehatan.'
  },
  {
    id: 'ann-3',
    title: 'Pengumuman Kegiatan Study Tour Kelas 4 & 5',
    date: '08 Mei 2026',
    category: 'Kegiatan',
    excerpt: 'Rencana kunjungan edukatif ke Museum Geologi dan Kebun Raya akan diadakan pada bulan depan...',
    content: 'Rencana kunjungan edukatif (study tour) tahunan ke Museum Geologi dan Kebun Raya akan diselenggarakan pada tanggal 12 Juli 2026. Biaya administrasi sebesar Rp 150.000 sudah termasuk transportasi, tiket masuk, dan makan siang. Formulir persetujuan dapat diambil melalui wali kelas masing-masing.'
  }
];

export const INITIAL_LIAISON_ENTRIES: LiaisonEntry[] = [
  {
    id: 'liaison-1',
    studentId: 'rian',
    studentName: 'Rian Hidayat',
    className: 'TK-A',
    taskTitle: 'PR Matematika - Perkalian Pecahan',
    subject: 'Matematika',
    status: 'Butuh Bimbingan',
    lastUpdated: '26 Jun 2026',
    messages: [
      {
        id: 'msg-1',
        senderRole: 'teacher',
        senderName: 'Pak Budi',
        message: 'Rian masih kesulitan memahami pembagian pecahan desimal. Mohon dibimbing kembali di rumah ya Bu, halaman 45 buku paket.',
        timestamp: '25 Jun 2026, 14:30'
      },
      {
        id: 'msg-2',
        senderRole: 'parent',
        senderName: 'Ibu Maria',
        message: 'Baik Pak Budi, malam ini akan kami ulas kembali bersama Rian di rumah. Terima kasih atas informasinya.',
        timestamp: '25 Jun 2026, 19:15'
      },
      {
        id: 'msg-3',
        senderRole: 'teacher',
        senderName: 'Pak Budi',
        message: 'Sama-sama Ibu Maria. Besok akan saya cek kembali latihan soalnya di kelas.',
        timestamp: '26 Jun 2026, 08:00'
      }
    ]
  },
  {
    id: 'liaison-2',
    studentId: 'rian',
    studentName: 'Rian Hidayat',
    className: 'TK-A',
    taskTitle: 'Tugas Prakarya - Membuat Rumah Kardus',
    subject: 'Seni Budaya & Prakarya',
    status: 'Sudah Dikerjakan',
    lastUpdated: '24 Jun 2026',
    messages: [
      {
        id: 'm1',
        senderRole: 'teacher',
        senderName: 'Pak Budi',
        message: 'Tugas prakarya membuat rumah dari kardus dikumpulkan paling lambat hari Jum\'at depan ya. Pastikan bahan-bahannya aman.',
        timestamp: '22 Jun 2026, 10:00'
      },
      {
        id: 'm2',
        senderRole: 'parent',
        senderName: 'Ibu Maria',
        message: 'Pak Budi, rumah kardus buatan Rian sudah selesai dikerjakan secara mandiri. Besok siap dibawa ke sekolah.',
        timestamp: '24 Jun 2026, 16:30'
      }
    ]
  },
  {
    id: 'liaison-3',
    studentId: 'citra',
    studentName: 'Citra Kirana',
    className: 'TK-A',
    taskTitle: 'Latihan Menulis Huruf Tegak Bersambung',
    subject: 'Bahasa Indonesia',
    status: 'Perlu Perhatian',
    lastUpdated: '26 Jun 2026',
    messages: [
      {
        id: 'm3',
        senderRole: 'teacher',
        senderName: 'Pak Budi',
        message: 'Citra belum mengumpulkan latihan menulis tegak bersambung yang diberikan hari Selasa lalu. Apakah ada kendala di rumah?',
        timestamp: '26 Jun 2026, 11:20'
      }
    ]
  }
];

export const INITIAL_COUNSELING_RECORDS: CounselingRecord[] = [
  {
    id: 'couns-1',
    studentId: 'rian',
    studentName: 'Rian Hidayat',
    className: 'TK-A',
    date: '25 Jun 2026',
    category: 'Sosial Emosional',
    title: 'Sikap Kooperatif & Kerja Sama Kelompok',
    notes: 'Rian menunjukkan sikap yang sangat baik saat bekerja dalam kelompok membuat rumah kardus. Ia aktif mendengarkan pendapat temannya, berbagi tugas secara adil, dan membantu temannya yang kesulitan.',
    recommendation: 'Mohon dukung sikap kooperatif Rian ini di rumah dengan memberikan apresiasi dan mengajarkan pentingnya gotong-royong dalam kehidupan sehari-hari.',
    teacherName: 'Pak Budi',
    status: 'Terpublikasi'
  },
  {
    id: 'couns-2',
    studentId: 'citra',
    studentName: 'Citra Kirana',
    className: 'TK-A',
    date: '26 Jun 2026',
    category: 'Perkembangan Kognitif',
    title: 'Minat Membaca & Kelancaran Mengeja',
    notes: 'Citra menunjukkan peningkatan yang sangat signifikan dalam membaca nyaring di kelas. Pengenalan kosakata baru dan kelancaran mengeja kalimat panjang sudah sangat baik dan melampaui rata-rata kelas.',
    recommendation: 'Sediakan buku cerita bergambar yang menarik di rumah agar minat baca Citra tetap terjaga dan kosa katanya semakin kaya.',
    teacherName: 'Pak Budi',
    status: 'Terpublikasi'
  }
];


