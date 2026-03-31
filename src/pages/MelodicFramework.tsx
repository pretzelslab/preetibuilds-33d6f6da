import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Search, Play, BookOpen, ChevronDown, ChevronUp, Plus, Loader2, RefreshCw } from "lucide-react";

const YT_API_KEY = "AIzaSyCq2BN9k3y8bU9yymWiroYBhdVnRPMIPnA";

interface YtResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Song {
  id: string;
  title: string;
  movie?: string;
  singer: string;
  composer: string;
  genre: "Hindustani Classical" | "Film";
  youtubeId?: string;       // 11-char YouTube video ID → enables inline embed
  youtubeQuery: string;     // fallback: opens YouTube search
  lyrics?: string;
  lyricsSource?: "generated" | "manual" | "fetched";
}

interface Raaga {
  id: string;
  name: string;
  hindiName: string;
  time?: string;
  season?: string;
  mood?: string;
  songs: Song[];
}

// ── Comprehensive raaga list ───────────────────────────────────────────────────
// Grouped by time of day. youtubeId left blank — populate from YouTube URLs.
const DEMO_RAAGAS: Raaga[] = [
  // ── Dawn (4–6 am) ──────────────────────────────────────────────────────────
  {
    id: "lalit",
    name: "Lalit",
    hindiName: "ललित",
    time: "Pre-dawn",
    mood: "Serene, Longing",
    songs: [
      {
        id: "lalit-1",
        title: "Lalit (Bandish)",
        singer: "Bade Ghulam Ali Khan",
        composer: "Traditional",
        genre: "Hindustani Classical",
        youtubeQuery: "Lalit raag Bade Ghulam Ali Khan bandish",
      },
    ],
  },
  {
    id: "bhairav",
    name: "Bhairav",
    hindiName: "भैरव",
    time: "Dawn",
    mood: "Devotional, Austere",
    songs: [
      {
        id: "bhairav-1",
        title: "Piya Bin Nahin Aavat Chain",
        movie: "Kohinoor",
        singer: "Mohammed Rafi",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "Piya Bin Nahin Aavat Chain Kohinoor Mohammed Rafi Naushad",
      },
    ],
  },
  {
    id: "ahir-bhairav",
    name: "Ahir Bhairav",
    hindiName: "अहीर भैरव",
    time: "Dawn",
    mood: "Peaceful, Devotional",
    songs: [
      {
        id: "ahir-bhairav-1",
        title: "Tere Bina Zindagi Se Koi Shikwa",
        movie: "Aandhi",
        singer: "Lata Mangeshkar, Kishore Kumar",
        composer: "R.D. Burman",
        genre: "Film",
        youtubeQuery: "Tere Bina Zindagi Se Koi Shikwa Aandhi Lata Kishore RD Burman",
      },
    ],
  },
  {
    id: "jogiya",
    name: "Jogiya",
    hindiName: "जोगिया",
    time: "Dawn",
    mood: "Melancholic, Mystical",
    songs: [
      {
        id: "jogiya-1",
        title: "Jogiya (Thumri)",
        singer: "Girija Devi",
        composer: "Traditional",
        genre: "Hindustani Classical",
        youtubeQuery: "Jogiya thumri Girija Devi",
      },
    ],
  },

  // ── Morning (6–9 am) ───────────────────────────────────────────────────────
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
    id: "todi",
    name: "Todi",
    hindiName: "तोड़ी",
    time: "Late Morning",
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
    id: "asavari",
    name: "Asavari",
    hindiName: "आसावरी",
    time: "Morning",
    mood: "Serious, Melancholic",
    songs: [
      {
        id: "asavari-1",
        title: "O Duniya Ke Rakhwale",
        movie: "Baiju Bawra",
        singer: "Mohammed Rafi",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "O Duniya Ke Rakhwale Baiju Bawra Mohammed Rafi Naushad",
      },
    ],
  },

  // ── Afternoon (12–4 pm) ────────────────────────────────────────────────────
  {
    id: "bhimpalasi",
    name: "Bhimpalasi",
    hindiName: "भीमपलासी",
    time: "Afternoon",
    mood: "Romantic, Contemplative",
    songs: [
      {
        id: "bhimpalasi-1",
        title: "Mohe Bhool Gaye Sawariya",
        movie: "Baiju Bawra",
        singer: "Lata Mangeshkar",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "Mohe Bhool Gaye Sawariya Baiju Bawra Lata Mangeshkar Naushad",
      },
    ],
  },
  {
    id: "multani",
    name: "Multani",
    hindiName: "मुल्तानी",
    time: "Afternoon",
    mood: "Serious, Deep",
    songs: [
      {
        id: "multani-1",
        title: "Multani (Vilambit)",
        singer: "Bhimsen Joshi",
        composer: "Traditional",
        genre: "Hindustani Classical",
        youtubeQuery: "Multani raag Bhimsen Joshi vilambit",
      },
    ],
  },
  {
    id: "madhuvanti",
    name: "Madhuvanti",
    hindiName: "मधुवंती",
    time: "Afternoon",
    mood: "Romantic, Joyful",
    songs: [
      {
        id: "madhuvanti-1",
        title: "Tere Pyar Ka Aasra Chahta Hoon",
        movie: "Dhool Ka Phool",
        singer: "Mohammed Rafi",
        composer: "N. Dutta",
        genre: "Film",
        youtubeQuery: "Tere Pyar Ka Aasra Chahta Hoon Dhool Ka Phool Rafi",
      },
    ],
  },
  {
    id: "bageshri",
    name: "Bageshri",
    hindiName: "बागेश्री",
    time: "Late Afternoon",
    season: "All seasons",
    mood: "Romantic, Longing",
    songs: [
      {
        id: "bageshri-1",
        title: "Kaun Aaya Mere Man Ke Dware",
        movie: "Dil Hi Toh Hai",
        singer: "Lata Mangeshkar",
        composer: "Roshan",
        genre: "Film",
        youtubeQuery: "Kaun Aaya Mere Man Ke Dware Dil Hi Toh Hai Lata Roshan",
      },
    ],
  },

  // ── Dusk / Evening (4–7 pm) ────────────────────────────────────────────────
  {
    id: "puriya",
    name: "Puriya",
    hindiName: "पूरिया",
    time: "Dusk",
    mood: "Intense, Longing",
    songs: [
      {
        id: "puriya-1",
        title: "Jo Tum Todo Piya",
        singer: "Kishori Amonkar",
        composer: "Traditional / Mirabai",
        genre: "Hindustani Classical",
        youtubeQuery: "Jo Tum Todo Piya Puriya Kishori Amonkar",
      },
    ],
  },
  {
    id: "marwa",
    name: "Marwa",
    hindiName: "मारवा",
    time: "Dusk",
    mood: "Intense, Anxious",
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
    id: "kedar",
    name: "Kedar",
    hindiName: "केदार",
    time: "Evening",
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
    id: "pahadi",
    name: "Pahadi",
    hindiName: "पहाड़ी",
    time: "Evening",
    mood: "Romantic, Nostalgic",
    songs: [
      {
        id: "pahadi-1",
        title: "Dil Dhoondta Hai Phir Wahi",
        movie: "Mausam",
        singer: "Bhupinder Singh",
        composer: "Madan Mohan",
        genre: "Film",
        youtubeQuery: "Dil Dhoondta Hai Phir Wahi Fursat Ke Raat Din Mausam Bhupinder Madan Mohan",
      },
    ],
  },

  // ── Night (7–10 pm) ────────────────────────────────────────────────────────
  {
    id: "khamaj",
    name: "Khamaj",
    hindiName: "खमाज",
    time: "Night",
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
    id: "kafi",
    name: "Kafi",
    hindiName: "काफी",
    time: "Night",
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
    id: "tilang",
    name: "Tilang",
    hindiName: "तिलंग",
    time: "Night",
    mood: "Romantic, Light",
    songs: [
      {
        id: "tilang-1",
        title: "Ye Raat Bheegi Bheegi",
        movie: "Chori Chori",
        singer: "Lata Mangeshkar, Mukesh",
        composer: "Shankar-Jaikishan",
        genre: "Film",
        youtubeQuery: "Ye Raat Bheegi Bheegi Chori Chori Lata Mukesh Shankar Jaikishan",
      },
    ],
  },
  {
    id: "bihag",
    name: "Bihag",
    hindiName: "बिहाग",
    time: "Night",
    mood: "Romantic, Tender",
    songs: [
      {
        id: "bihag-1",
        title: "Kaise Din Beete Kaise Beeti Ratiyaan",
        movie: "Mera Saaya",
        singer: "Lata Mangeshkar",
        composer: "Madan Mohan",
        genre: "Film",
        youtubeQuery: "Kaise Din Beete Kaise Beeti Ratiyaan Mera Saaya Lata Madan Mohan",
      },
    ],
  },
  {
    id: "durga",
    name: "Durga",
    hindiName: "दुर्गा",
    time: "Night",
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

  // ── Late Night (10 pm–2 am) ────────────────────────────────────────────────
  {
    id: "malkauns",
    name: "Malkauns",
    hindiName: "मालकौंस",
    time: "Late Night",
    mood: "Profound, Meditative",
    songs: [
      {
        id: "malkauns-1",
        title: "Man Tarpat Hari Darshan Ko Aaj",
        movie: "Baiju Bawra",
        singer: "Mohammed Rafi",
        composer: "Naushad",
        genre: "Film",
        youtubeQuery: "Man Tarpat Hari Darshan Ko Aaj Baiju Bawra Rafi Naushad",
      },
    ],
  },
  {
    id: "darbari",
    name: "Darbari Kanada",
    hindiName: "दरबारी कान्हड़ा",
    time: "Late Night",
    mood: "Grave, Majestic",
    songs: [
      {
        id: "darbari-1",
        title: "Jhanak Jhanak Tori Baaje Payaliya",
        movie: "Jhanak Jhanak Payal Baaje",
        singer: "Lata Mangeshkar",
        composer: "Vasant Desai",
        genre: "Film",
        youtubeQuery: "Jhanak Jhanak Tori Baaje Payaliya Lata Mangeshkar Vasant Desai",
      },
    ],
  },
  {
    id: "jaunpuri",
    name: "Jaunpuri",
    hindiName: "जौनपुरी",
    time: "Late Night",
    mood: "Serious, Melancholic",
    songs: [
      {
        id: "jaunpuri-1",
        title: "Jaunpuri (Vilambit Khayal)",
        singer: "Bhimsen Joshi",
        composer: "Traditional",
        genre: "Hindustani Classical",
        youtubeQuery: "Jaunpuri vilambit khayal Bhimsen Joshi",
      },
    ],
  },

  // ── Monsoon / Seasonal ─────────────────────────────────────────────────────
  {
    id: "miyan-malhar",
    name: "Miyan Ki Malhar",
    hindiName: "मियाँ की मल्हार",
    time: "Night",
    season: "Monsoon",
    mood: "Romantic, Longing",
    songs: [
      {
        id: "miyan-malhar-1",
        title: "Barase Badariya Saawan Ki",
        movie: "Chori Chori",
        singer: "Lata Mangeshkar",
        composer: "Shankar-Jaikishan",
        genre: "Film",
        youtubeQuery: "Barase Badariya Saawan Ki Chori Chori Lata Shankar Jaikishan",
      },
    ],
  },
  {
    id: "pilu",
    name: "Pilu",
    hindiName: "पीलू",
    time: "Any time",
    mood: "Light, Romantic",
    songs: [
      {
        id: "pilu-1",
        title: "Babul Ki Duaen Leti Ja",
        movie: "Neelkamal",
        singer: "Lata Mangeshkar",
        composer: "Ravi",
        genre: "Film",
        youtubeQuery: "Babul Ki Duaen Leti Ja Neelkamal Lata Mangeshkar Ravi",
      },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const GENRE_COLORS: Record<string, string> = {
  "Hindustani Classical": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Film": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const TIME_ORDER = ["Pre-dawn", "Dawn", "Morning", "Late Morning", "Afternoon", "Late Afternoon", "Dusk", "Evening", "Night", "Late Night", "Any time"];

// ── Song row ──────────────────────────────────────────────────────────────────
function SongRow({
  song,
  selectedId,
  onSelect,
}: {
  song: Song;
  selectedId?: string;
  onSelect: (videoId: string) => void;
}) {
  const [showLyrics, setShowLyrics] = useState(false);
  const [results, setResults] = useState<YtResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const activeId = selectedId || song.youtubeId;

  async function findOnYouTube() {
    setSearching(true);
    setShowResults(true);
    setShowEmbed(false);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(song.youtubeQuery)}&type=video&maxResults=4&key=${YT_API_KEY}`
      );
      const data = await res.json();
      const items: YtResult[] = (data.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
      }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pickVideo(videoId: string) {
    onSelect(videoId);
    setShowResults(false);
    setShowEmbed(true);
  }

  return (
    <div className="space-y-2 pt-2 first:pt-0 border-t border-border/30 first:border-0">
      {/* Meta row */}
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play / Find button */}
          {activeId ? (
            <>
              <button
                onClick={() => { setShowEmbed(!showEmbed); setShowResults(false); }}
                title={showEmbed ? "Close player" : "Play inline"}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showEmbed ? "bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={findOnYouTube}
                title="Find different version"
                className="w-7 h-7 rounded-full border border-border hover:border-violet-400 flex items-center justify-center transition-colors text-muted-foreground hover:text-violet-600"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              onClick={findOnYouTube}
              title="Find on YouTube"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold transition-colors"
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
              {searching ? "Searching…" : "Find & Play"}
            </button>
          )}
        </div>
      </div>

      {/* YouTube search results picker */}
      {showResults && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-2 space-y-1.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide px-1">
            {searching ? "Searching YouTube…" : `${results.length} results — pick a version`}
          </p>
          {searching && (
            <div className="flex items-center gap-2 px-1 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span className="text-xs text-muted-foreground">Fetching from YouTube…</span>
            </div>
          )}
          {!searching && results.map(r => (
            <button
              key={r.videoId}
              onClick={() => pickVideo(r.videoId)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-violet-500/10 transition-colors text-left group"
            >
              <img src={r.thumbnail} alt={r.title} className="w-16 h-10 rounded object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-violet-600 transition-colors">{r.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.channel}</p>
              </div>
            </button>
          ))}
          {!searching && results.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-1">No results found.</p>
          )}
        </div>
      )}

      {/* Inline YouTube embed */}
      {activeId && showEmbed && (
        <div className="rounded-lg overflow-hidden border border-border/50">
          <iframe
            src={`https://www.youtube.com/embed/${activeId}?autoplay=1`}
            className="w-full"
            height="140"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={song.title}
          />
        </div>
      )}

      {/* Lyrics */}
      <div className="rounded-lg bg-muted/30 border border-border/40 p-2">
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
          <p className="text-xs text-muted-foreground italic mt-1.5">
            {song.lyrics || "Lyrics not yet added. Click Generate to create with AI."}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Raaga card ────────────────────────────────────────────────────────────────
function RaagaCard({
  raaga, index, selectedIds, onSelect,
}: {
  raaga: Raaga;
  index: number;
  selectedIds: Record<string, string>;
  onSelect: (songId: string, videoId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03 }}
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{raaga.name}</span>
              <span className="text-xs text-muted-foreground font-serif">{raaga.hindiName}</span>
            </div>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {raaga.time && <span className="text-[10px] text-muted-foreground">{raaga.time}</span>}
              {raaga.season && <span className="text-[10px] text-muted-foreground/60">· {raaga.season}</span>}
              {raaga.mood && <span className="text-[10px] text-muted-foreground/50 truncate max-w-[130px]">· {raaga.mood}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground/50">{raaga.songs.length}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3">
          {raaga.songs.map(s => (
            <SongRow
              key={s.id}
              song={s}
              selectedId={selectedIds[s.id]}
              onSelect={(videoId) => onSelect(s.id, videoId)}
            />
          ))}
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-violet-400 hover:text-violet-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add alternate version
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MelodicFramework() {
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Record<string, string>>({});

  function handleSelect(songId: string, videoId: string) {
    setSelectedIds(prev => ({ ...prev, [songId]: videoId }));
  }

  const times = ["All", ...TIME_ORDER.filter(t => DEMO_RAAGAS.some(r => r.time === t))];

  const filtered = DEMO_RAAGAS.filter(r => {
    const matchesTime = timeFilter === "All" || r.time === timeFilter;
    const matchesQuery = !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.hindiName.includes(query) ||
      r.mood?.toLowerCase().includes(query.toLowerCase()) ||
      r.time?.toLowerCase().includes(query.toLowerCase()) ||
      r.season?.toLowerCase().includes(query.toLowerCase()) ||
      r.songs.some(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.singer.toLowerCase().includes(query.toLowerCase()) ||
        s.movie?.toLowerCase().includes(query.toLowerCase()) ||
        s.composer.toLowerCase().includes(query.toLowerCase())
      );
    return matchesTime && matchesQuery;
  });

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

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎵</span>
            <div>
              <h1 className="text-2xl font-bold">Melodic Framework</h1>
              <p className="text-xs text-muted-foreground font-serif">(Raaga)</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Hindustani classical and film raagas — one canonical song per raaga, inline playback, and AI-generated lyrics.
          </p>
        </motion.div>

        {/* Search + time filter */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5 space-y-2">
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
          {/* Time-of-day chips */}
          <div className="flex flex-wrap gap-1.5">
            {times.map(t => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  timeFilter === t
                    ? "bg-violet-600 text-white border-violet-600"
                    : "border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {(query || timeFilter !== "All") && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} raaga{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </motion.div>

        {/* Raaga grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.length ? (
            filtered.map((r, i) => (
              <RaagaCard
                key={r.id}
                raaga={r}
                index={i}
                selectedIds={selectedIds}
                onSelect={handleSelect}
              />
            ))
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
