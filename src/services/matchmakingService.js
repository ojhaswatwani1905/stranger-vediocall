// Simulated Redis-backed matchmaking queue & WebRTC session generator

const STRANGER_POOL = [
  {
    id: 'usr-stranger-01',
    name: 'Elena Rostova',
    gender: 'female',
    country: 'Spain',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    greeting: 'Hola! Nice to connect from Barcelona'
  },
  {
    id: 'usr-stranger-02',
    name: 'Kenji Sato',
    gender: 'male',
    country: 'Japan',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    greeting: 'Hey there! How is your day going?'
  },
  {
    id: 'usr-stranger-03',
    name: 'Maya Lin',
    gender: 'female',
    country: 'Singapore',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    greeting: 'Hello! Excited to make new friends around the world ✨'
  },
  {
    id: 'usr-stranger-04',
    name: 'David Miller',
    gender: 'male',
    country: 'United States',
    age: 29,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    greeting: 'What’s up! Cool app interface!'
  },
  {
    id: 'usr-stranger-05',
    name: 'Sophie Bennett',
    gender: 'female',
    country: 'United Kingdom',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    greeting: 'Cheers from London! Hope you’re having a great day ☕'
  },
  {
    id: 'usr-stranger-06',
    name: 'Lukas Weber',
    gender: 'male',
    country: 'Germany',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    greeting: 'Hallo! Calling from Berlin 🍺'
  },
  {
    id: 'usr-stranger-07',
    name: 'Priya Sharma',
    gender: 'female',
    country: 'India',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    greeting: 'Namaste! Great connecting with you 🙏'
  },
  {
    id: 'usr-stranger-08',
    name: 'Camila Silva',
    gender: 'female',
    country: 'Brazil',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    greeting: 'Olá de Rio de Janeiro! 🇧🇷'
  },
  {
    id: 'usr-stranger-09',
    name: 'Min-Jun Park',
    gender: 'male',
    country: 'South Korea',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    greeting: 'Annyeonghaseyo! Greetings from Seoul! ✌️'
  },
  {
    id: 'usr-stranger-10',
    name: 'Liam O’Connor',
    gender: 'male',
    country: 'Australia',
    age: 30,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    greeting: 'G’day mate! How’s it going down under?'
  }
];

export const searchMatch = ({ mode = 'video', genderFilter = 'any', locationFilter = 'any', excludeIds = [] }) => {
  return new Promise((resolve) => {
    // Simulated Queue Latency (1.2 to 2.5s)
    const delay = 1200 + Math.random() * 1300;

    setTimeout(() => {
      let candidates = STRANGER_POOL.filter((s) => !excludeIds.includes(s.id));

      if (genderFilter !== 'any') {
        candidates = candidates.filter((s) => s.gender === genderFilter);
      }
      if (locationFilter !== 'any') {
        candidates = candidates.filter((s) => s.country.toLowerCase().includes(locationFilter.toLowerCase()));
      }

      if (candidates.length === 0) {
        // Fallback to random stranger if filters too strict
        candidates = STRANGER_POOL.filter((s) => !excludeIds.includes(s.id));
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)] || STRANGER_POOL[0];

      resolve({
        sessionId: `sess-${Date.now()}`,
        matchedUser: match,
        mode,
        startedAt: new Date().toISOString()
      });
    }, delay);
  });
};
