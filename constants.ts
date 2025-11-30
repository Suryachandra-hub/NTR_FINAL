import { Movie, LeaderboardEntry, PendingUpload, AuditLogEntry, Song } from './types';

// Full list of 59 Districts (26 AP + 33 TS)
export const DISTRICTS = [
  // --- ANDHRA PRADESH (26) ---
  "Alluri Sitharama Raju (AP)", "Anakapalli (AP)", "Anantapur (AP)", "Annamayya (AP)", "Bapatla (AP)", 
  "Chittoor (AP)", "Dr. B.R. Ambedkar Konaseema (AP)", "East Godavari (AP)", "Eluru (AP)", "Guntur (AP)", 
  "Kakinada (AP)", "Krishna (AP)", "Kurnool (AP)", "Nandyal (AP)", "NTR (AP)", "Palnadu (AP)", 
  "Parvathipuram Manyam (AP)", "Prakasam (AP)", "Sri Potti Sriramulu Nellore (AP)", "Sri Sathya Sai (AP)", 
  "Srikakulam (AP)", "Tirupati (AP)", "Visakhapatnam (AP)", "Vizianagaram (AP)", "West Godavari (AP)", "YSR Kadapa (AP)",
  
  // --- TELANGANA (33) ---
  "Adilabad (TS)", "Bhadradri Kothagudem (TS)", "Hanamkonda (TS)", "Hyderabad (TS)", "Jagtial (TS)", 
  "Jangaon (TS)", "Jayashankar Bhupalpally (TS)", "Jogulamba Gadwal (TS)", "Kamareddy (TS)", "Karimnagar (TS)", 
  "Khammam (TS)", "Kumuram Bheem Asifabad (TS)", "Mahabubabad (TS)", "Mahabubnagar (TS)", "Mancherial (TS)", 
  "Medak (TS)", "Medchal-Malkajgiri (TS)", "Mulugu (TS)", "Nagarkurnool (TS)", "Nalgonda (TS)", 
  "Narayanpet (TS)", "Nirmal (TS)", "Nizamabad (TS)", "Peddapalli (TS)", "Rajanna Sircilla (TS)", 
  "Rangareddy (TS)", "Sangareddy (TS)", "Siddipet (TS)", "Suryapet (TS)", "Vikarabad (TS)", 
  "Wanaparthy (TS)", "Warangal (TS)", "Yadadri Bhuvanagiri (TS)",

  // --- OTHERS ---
  "Other / NRI"
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// --- DAILY DIALOGUES ---
export const NTR_QUOTES = [
  { text: "Avasaram aithe daari marchukunta... kani gamyam mathram maravanu.", movie: "Janatha Garage" },
  { text: "Dhandayatra... Idhi Dhaya gadi Dhandayatra!", movie: "Temper" },
  { text: "Balavantudu balaheenudni bhayapettadam anadhiyuga vasthunna aacharam... Kaani a balaheenudi pakka nenu unnanu!", movie: "Devara" },
  { text: "Yuddham cheyalanukunte... aayudham avasaram ledu... dhammu unte chaalu!", movie: "Dammu" },
  { text: "Nenu thodunkotte varake... Aa tarvatha... Thode kottestadi!", movie: "Aravinda Sametha" },
  { text: "Okkasari commit ayithe... naa maata nene vinanu.", movie: "Temper" },
  { text: "Pommante vellipodaniki nenu panimanishini kadhu... POTUGADINI.", movie: "Mirchi (Contextual Fan Fav)" }, 
  { text: "City ki chala mandi comissioner lu vastuntaru pothuntaru... kani ikkada permanent ga undedi okkade... DAYA.", movie: "Temper" },
  { text: "Thirigi velle lopala... Prathi okkadi lekkalu maaripothay!", movie: "Devara" }
];

export const getDailyQuote = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return NTR_QUOTES[day % NTR_QUOTES.length];
};

export const MOVIES_DATA: Movie[] = [
  {
    id: 'm11',
    title: 'War 2',
    year: 2025,
    role: 'Lead Antagonist / Spy',
    type: 'Pan-India',
    verdict: 'Blockbuster',
    image: 'https://upload.wikimedia.org/wikipedia/en/2/23/War_2_poster.jpg',
    releaseDate: '14 Aug 2025',
    budget: '₹400 Crores',
    boxOffice: 'Loading...',
    director: 'Ayan Mukerji',
    musicDirector: 'Pritam',
    songs: ['Coming Soon'],
    description: 'The epic face-off in the YRF Spy Universe.'
  },
  {
    id: 'm1',
    title: 'Devara: Part 1',
    year: 2024,
    role: 'Devara / Vara',
    type: 'Pan-India',
    verdict: 'Blockbuster',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/A8u7KdfQZ5T29E7J5J9q8Z3Z5q8.jpg', 
    releaseDate: '27 Sep 2024',
    budget: '₹300 Crores',
    boxOffice: '₹500+ Crores',
    director: 'Koratala Siva',
    musicDirector: 'Anirudh Ravichander',
    songs: ['Fear Song', 'Chuttamalle', 'Daavudi', 'Ayudha Pooja'],
    description: 'An epic action saga set against the backdrop of coastal lands, where Devara, a fearless man, fights for his people against injustice.'
  },
  {
    id: 'm2',
    title: 'RRR',
    year: 2022,
    role: 'Komaram Bheem',
    type: 'Pan-India',
    verdict: 'Blockbuster',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg',
    releaseDate: '24 Mar 2022',
    budget: '₹550 Crores',
    boxOffice: '₹1387 Crores (Global)',
    director: 'S.S. Rajamouli',
    musicDirector: 'M.M. Keeravani',
    songs: ['Naatu Naatu (Oscar Winner)', 'Komuram Bheemudo', 'Dosti', 'Etthara Jenda'],
    description: 'A fictitious story about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s.'
  },
  {
    id: 'm3',
    title: 'Aravinda Sametha',
    year: 2018,
    role: 'Veera Raghava',
    type: 'Mass',
    verdict: 'Super Hit',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/6q4Wj5z1Q5Z7y9Y8x4Q6w2A3B.jpg',
    releaseDate: '11 Oct 2018',
    budget: '₹60 Crores',
    boxOffice: '₹165 Crores',
    director: 'Trivikram Srinivas',
    musicDirector: 'S. Thaman',
    songs: ['Peniviti', 'Anaganaganaga', 'Yeda Poyinado', 'Reddy Ikkada Soodu'],
    description: 'A young scion of a powerful factionalist family tries to put an end to the violence that has ravaged his region for decades.'
  },
  {
    id: 'm4',
    title: 'Jai Lava Kusa',
    year: 2017,
    role: 'Jai / Lava / Kusa',
    type: 'Mass',
    verdict: 'Hit',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/br7nJJ1Z1z2Z2y9x2C2x2X2x2.jpg',
    releaseDate: '21 Sep 2017',
    budget: '₹45 Crores',
    boxOffice: '₹130 Crores',
    director: 'K.S. Ravindra',
    musicDirector: 'Devi Sri Prasad',
    songs: ['Raavana', 'Tring Tring', 'Nee Kallalona', 'Dochestha'],
    description: 'Identical triplets, separated at a young age, follow different paths in life, but are brought together by destiny for a larger cause.'
  },
  {
    id: 'm5',
    title: 'Janatha Garage',
    year: 2016,
    role: 'Anand',
    type: 'Class',
    verdict: 'Blockbuster',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/4q2x2x2x2x2x2x2x2x2x2.jpg',
    releaseDate: '1 Sep 2016',
    budget: '₹50 Crores',
    boxOffice: '₹135 Crores',
    director: 'Koratala Siva',
    musicDirector: 'Devi Sri Prasad',
    songs: ['Pranaamam', 'Rock On Bro', 'Apple Beauty', 'Jayaho Janatha'],
    description: 'An environmental activist comes to Hyderabad to attend a seminar, where an unexpected encounter changes his purpose in life.'
  },
  {
    id: 'm6',
    title: 'Nannaku Prematho',
    year: 2016,
    role: 'Abhiram',
    type: 'Class',
    verdict: 'Hit',
    image: 'https://media.themoviedb.org/t/p/w600_and_h900_bestv2/m1b9y2y2y2y2y2y2y2y2y2.jpg', 
    releaseDate: '13 Jan 2016',
    budget: '₹50 Crores',
    boxOffice: '₹87 Crores',
    director: 'Sukumar',
    musicDirector: 'Devi Sri Prasad',
    songs: ['Follow Follow', 'Na Manasu Neelo', 'Love Me Again', 'Don\'t Stop'],
    description: 'An intelligent son takes revenge on a cunning businessman who cheated his father, using mind games rather than violence.'
  },
  {
    id: 'm7',
    title: 'Temper',
    year: 2015,
    role: 'Daya',
    type: 'Mass',
    verdict: 'Blockbuster',
    image: 'https://upload.wikimedia.org/wikipedia/en/8/85/Temper_film_poster.jpg',
    releaseDate: '13 Feb 2015',
    budget: '₹35 Crores',
    boxOffice: '₹74 Crores',
    director: 'Puri Jagannadh',
    musicDirector: 'Anup Rubens',
    songs: ['Temper Title Song', 'Choolenge Aasma', 'Ittage Recchipodam', 'Devudaa'],
    description: 'A corrupt police officer undergoes a transformation after stumbling upon a heinous crime, deciding to fight for justice.'
  },
  {
    id: 'm8',
    title: 'Simhadri',
    year: 2003,
    role: 'Simhadri',
    type: 'Mass',
    verdict: 'Cult Classic',
    image: 'https://upload.wikimedia.org/wikipedia/en/1/1a/Simhadri_DVD_cover.jpg',
    releaseDate: '9 Jul 2003',
    budget: '₹8.5 Crores',
    boxOffice: '₹46 Crores (Industry Hit)',
    director: 'S.S. Rajamouli',
    musicDirector: 'M.M. Keeravani',
    songs: ['Amma Kishore', 'Singamalai', 'Cheema Cheema', 'Nuvvu Whistlesthe'],
    description: 'A loyal servant takes on a violent path to protect his master\'s family and eventually unites two warring regions.'
  },
  {
    id: 'm9',
    title: 'Adhurs',
    year: 2010,
    role: 'Narasimha / Chari',
    type: 'Mass',
    verdict: 'Super Hit',
    image: 'https://upload.wikimedia.org/wikipedia/en/1/13/Adhurs_poster.jpg',
    releaseDate: '13 Jan 2010',
    budget: '₹26 Crores',
    boxOffice: '₹40 Crores',
    director: 'V.V. Vinayak',
    musicDirector: 'Devi Sri Prasad',
    songs: ['Adhurs Title Song', 'Chandrakala', 'Pilla Naa Valla Kaadu', 'Shiva Sambho'],
    description: 'Two twin brothers separated at birth are forced to come together to save their mother from a gangster.'
  },
  {
    id: 'm10',
    title: 'Yamadonga',
    year: 2007,
    role: 'Raja',
    type: 'Mass',
    verdict: 'Blockbuster',
    image: 'https://upload.wikimedia.org/wikipedia/en/1/18/Yamadonga.jpg',
    releaseDate: '15 Aug 2007',
    budget: '₹20 Crores',
    boxOffice: '₹54 Crores',
    director: 'S.S. Rajamouli',
    musicDirector: 'M.M. Keeravani',
    songs: ['Rabaru Gajulu', 'Nachore Nachore', 'Nuvvu Muttukunte', 'Young Yama'],
    description: 'A thief dies and goes to Yamaloka, where he creates chaos and confusion among the gods to get his life back.'
  }
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [];
export const MOCK_PENDING_UPLOADS: PendingUpload[] = [];
export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];
export const DISCLAIMER_TEXT = "NTR WORLD is a fan community platform. The Emergency Donor feature is a coordination tool, not a medical service. We do not guarantee donor availability. In a medical emergency, ALWAYS contact official emergency services (108/100) first.";
export const NTR_PLAYLIST: Song[] = [];
