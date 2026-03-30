import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Search, Play, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Raaga {
  id: string;
  name: string;
  hindiName: string;
  time?: string;
  season?: string;
  mood?: string;
  songs: Song[];
}

interface Song {
  id: string;
  title: string;
  movie?: string;
  singer: string;
  composer: string;
  genre: "Hindustani Classical" | "Film";
  youtubeQuery: string; // used to open YouTube search
  lyrics?: string;
  lyricsSource?: "generated" | "manual" | "fetched";
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RAAGAS: Raaga[] = [
  {
    id: "yaman",
    name: "Yaman",
    hindiName: "यमन",
    time: "Evening",
    season: "All seasons",
    mood: "Romantic, Peaceful",
    songs: [
      {
        id: "yaman-1",
        title: "Kahe Tarse Naina",
        movie: "Baiju Bawra",
        singer: "Lata Mangeshkar",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "Kahe Tarse Naina Baiju Bawra Lata Mangeshkar",
      },
    ],
  },
  {
    id: "bhairavi",
    name: "Bhairavi",
    hindiName: "भैरवी",
    time: "Morning",
    season: "All seasons",
    mood: "Devotional, Melancholic",
    songs: [
      {
        id: "bhairavi-1",
        title: "Babul Mora",
        singer: "K.L. Saigal",
        composer: "Traditional / Wajid Ali Shah",
        genre: "Hindustani Classical",
        youtubeQuery: "Babul Mora KL Saigal Bhairavi",
      },
    ],
  },
  {
    id: "desh",
    name: "Desh",
    hindiName: "देश",
    time: "Night",
    season: "Monsoon",
    mood: "Romantic, Joyful",
    songs: [
      {
        id: "desh-1",
        title: "Vande Mataram",
        movie: "Anand Math",
        singer: "Lata Mangeshkar",
        composer: "Hemant Kumar",
        genre: "Film",
        youtubeQuery: "Vande Mataram Anand Math Lata Mangeshkar",
      },
    ],
  },
  {
    id: "bhupali",
    name: "Bhupali",
    hindiName: "भूपाली",
    time: "Evening",
    season: "All seasons",
    mood: "Serene, Devotional",
    songs: [
      {
        id: "bhupali-1",
        title: "Tum Agar Saath Dene Ka Wada Karo",
        movie: "Hamraaz",
        singer: "Mahendra Kapoor",
        composer: "Ravi",
        genre: "Film",
        youtubeQuery: "Tum Agar Saath Dene Ka Wada Karo Hamraaz Mahendra Kapoor",
      },
    ],
  },
  {
    id: "khamaj",
    name: "Khamaj",
    hindiName: "खमाज",
    time: "Night",
    season: "All seasons",
    mood: "Romantic, Playful",
    songs: [
      {
        id: "khamaj-1",
        title: "Mohe Panghat Pe",
        movie: "Mughal-E-Azam",
        singer: "Lata Mangeshkar",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "Mohe Panghat Pe Mughal E Azam Lata Mangeshkar",
      },
    ],
  },
  {
    id: "kafi",
    name: "Kafi",
    hindiName: "काफी",
    time: "Midnight",
    season: "Spring",
    mood: "Romantic, Melancholic",
    songs: [
      {
        id: "kafi-1",
        title: "Piya Bawri",
        movie: "Khoobsurat",
        singer: "Asha Bhosle",
        composer: "R.D. Burman",
        genre: "Film",
        youtubeQuery: "Piya Bawri Khoobsurat Asha Bhosle RD Burman",
      },
    ],
  },
  {
    id: "durga",
    name: "Durga",
    hindiName: "दुर्गा",
    time: "Night",
    season: "All seasons",
    mood: "Devotional, Joyful",
    songs: [
      {
        id: "durga-1",
        title: "Jai Jagdish Hare",
        movie: "Anand",
        singer: "Mukesh",
        composer: "Salil Chowdhury",
        genre: "Film",
        youtubeQuery: "Jai Jagdish Hare Anand Mukesh Salil Chowdhury",
      },
    ],
  },
  {
    id: "kedar",
    name: "Kedar",
    hindiName: "केदार",
    time: "Night",
    season: "All seasons",
    mood: "Devotional, Peaceful",
    songs: [
      {
        id: "kedar-1",
        title: "Mere Toh Giridhar Gopal",
        singer: "M.S. Subbulakshmi",
        composer: "Traditional / Mirabai",
        genre: "Hindustani Classical",
        youtubeQuery: "Mere Toh Giridhar Gopal MS Subbulakshmi Kedar",
      },
    ],
  },
  {
    id: "todi",
    name: "Todi",
    hindiName: "तोड़ी",
    time: "Late Morning",
    season: "All seasons",
    mood: "Serious, Contemplative",
    songs: [
      {
        id: "todi-1",
        title: "Aaj Jaane Ki Zid Na Karo",
        singer: "Fareeda Khanum",
        composer: "Traditional",
        genre: "Hindustani Classical",
        youtubeQuery: "Aaj Jaane Ki Zid Na Karo Fareeda Khanum",
      },
    ],
  },
  {
    id: "marwa",
    name: "Marwa",
    hindiName: "मारवा",
    time: "Dusk",
    season: "All seasons",
    mood: "Intense, Longing",
    songs: [
      {
        id: "marwa-1",
        title: "Aayega Aayega Aanewala",
        movie: "Mahal",
        singer: "Lata Mangeshkar",
        composer: "Khemchand Prakash",
        genre: "Film",
        youtubeQuery: "Aayega Aayega Aanewala Mahal Lata Mangeshkar",
      },
    ],
  },
];

const GENRE_COLORS: Record<string, string> = {
  "Hindustani Classical": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Film": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// ── Components ─────────────────────────────────────────────────────────────────
function RaagaCard({ raaga, index }: { raaga: Raaga; index: number }) {
  const [open, setOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const song = raaga.songs[0];

  const openYouTube = () => {
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(song.youtubeQuery)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="border border-border/60 rounded-xl overflow-hidden bg-card"
    >
      {/* Header */}
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{raaga.name}</span>
              <span className="text-xs text-muted-foreground font-serif">{raaga.hindiName}</span>
            </div>
            <div className="flex gap-2 mt-0.5">
              {raaga.time && <span className="text-[10px] text-muted-foreground">{raaga.time}</span>}
              {raaga.mood && <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">· {raaga.mood}</span>}
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3">
          {/* Song meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {song.singer}{song.movie ? ` · ${song.movie}` : ""} · {song.composer}
              </p>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${GENRE_COLORS[song.genre]}`}>
                {song.genre}
              </span>
            </div>
            <button
              onClick={openYouTube}
              title="Search on YouTube"
              className="shrink-0 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </button>
          </div>

          {/* Lyrics toggle */}
          <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Lyrics {showLyrics ? "▲" : "▼"}
              </button>
              {!song.lyrics && (
                <button className="text-[10px] text-violet-600 font-semibold hover:underline">Generate with AI</button>
              )}
            </div>
            {showLyrics && (
              <p className="text-xs text-muted-foreground italic mt-2">
                {song.lyrics || "Lyrics not yet added. Click Generate to create with AI."}
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MelodicFramework() {
  const [query, setQuery] = useState("");

  const filtered = DEMO_RAAGAS.filter(r =>
    !query ||
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.hindiName.includes(query) ||
    r.mood?.toLowerCase().includes(query.toLowerCase()) ||
    r.time?.toLowerCase().includes(query.toLowerCase()) ||
    r.songs.some(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.singer.toLowerCase().includes(query.toLowerCase()) ||
      s.movie?.toLowerCase().includes(query.toLowerCase()) ||
      s.composer.toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-xs text-muted-foreground font-mono">{DEMO_RAAGAS.length} raagas</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎵</span>
            <div>
              <h1 className="text-2xl font-bold">Melodic Framework</h1>
              <p className="text-xs text-muted-foreground font-serif">(Raaga)</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Hindustani classical and film raagas — one canonical song per raaga, with YouTube playback and AI-generated lyrics.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search raaga, mood, time, song, singer, movie…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-violet-400 transition-colors"
            />
          </div>
          {query && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {filtered.length} raaga{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}
        </motion.div>

        {/* Raaga grid — 2 columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length ? (
            filtered.map((r, i) => <RaagaCard key={r.id} raaga={r} index={i} />)
          ) : (
            <div className="col-span-2 text-center py-16 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No raagas match your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
