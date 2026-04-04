import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Search, Play, BookOpen, ChevronDown, ChevronUp, Plus, Loader2, RefreshCw, Shield } from "lucide-react";
import VisitorCounter from "@/components/portfolio/VisitorCounter";
import Comments from "@/components/portfolio/Comments";
import { govDb } from "@/lib/supabase-governance";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";

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
            <button
              className="text-[10px] text-violet-400 font-semibold cursor-not-allowed opacity-60"
              title="AI lyrics generation — coming soon"
              disabled
            >
              Generate with AI (coming soon)
            </button>
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

// ── Flatten all songs from DEMO_RAAGAS for autosuggest ────────────────────────
const ALL_KNOWN_SONGS: Array<{ song: Song; raagaId: string; raagaName: string }> =
  DEMO_RAAGAS.flatMap(r => r.songs.map(s => ({ song: s, raagaId: r.id, raagaName: r.name })));

// ── Add Song Form (inline per raaga, or in modal with raaga picker) ───────────
function AddSongForm({
  raagas,
  defaultRaagaId,
  onAdd,
  onCancel,
}: {
  raagas: Raaga[];
  defaultRaagaId?: string;
  onAdd: (raaagaId: string, song: Song) => void;
  onCancel: () => void;
}) {
  const [raaagaId, setRaaagaId] = useState(defaultRaagaId || "");
  const [title, setTitle] = useState("");
  const [singer, setSinger] = useState("");
  const [movie, setMovie] = useState("");
  const [composer, setComposer] = useState("");
  const [genre, setGenre] = useState<"Film" | "Hindustani Classical">("Film");
  const [ytResults, setYtResults] = useState<YtResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickedVideo, setPickedVideo] = useState<YtResult | null>(null);
  const [suggestions, setSuggestions] = useState<typeof ALL_KNOWN_SONGS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSuggest, setActiveSuggest] = useState<"singer"|"movie"|"composer"|null>(null);
  const ytDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPickedRef = useRef(false); // suppress auto-search once a video is picked

  // ── Field-level suggestion helper ────────────────────────────────────────
  function makeSuggest(field: "singer" | "movie" | "composer") {
    return (val: string) => {
      if (val.length < 2) return [];
      const q = val.toLowerCase();
      return [...new Set(
        ALL_KNOWN_SONGS
          .map(({ song }) => (field === "singer" ? song.singer : field === "movie" ? (song.movie || "") : song.composer))
          .filter(v => v && v.toLowerCase().includes(q))
      )].slice(0, 5);
    };
  }
  const singerSuggestions = singer.length >= 2 ? makeSuggest("singer")(singer) : [];
  const movieSuggestions  = movie.length  >= 2 ? makeSuggest("movie")(movie)   : [];
  const composerSuggestions = composer.length >= 2 ? makeSuggest("composer")(composer) : [];

  async function runYTSearch(q: string) {
    if (!q.trim()) return;
    setSearching(true);
    setYtResults([]);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=4&key=${YT_API_KEY}`
      );
      const data = await res.json();
      setYtResults((data.items || []).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
      })));
    } finally {
      setSearching(false);
    }
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    // Library autosuggest
    if (val.length >= 2) {
      const q = val.toLowerCase();
      const matches = ALL_KNOWN_SONGS.filter(({ song }) =>
        song.title.toLowerCase().includes(q) ||
        song.singer.toLowerCase().includes(q) ||
        (song.movie?.toLowerCase().includes(q))
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    // Debounced YouTube auto-search — suppressed once user has picked a video
    if (!hasPickedRef.current) {
      if (ytDebounce.current) clearTimeout(ytDebounce.current);
      if (val.length >= 3) {
        ytDebounce.current = setTimeout(() => runYTSearch(val), 600);
      } else {
        setYtResults([]);
      }
    }
  }

  function pickSuggestion(item: typeof ALL_KNOWN_SONGS[0]) {
    setTitle(item.song.title);
    setSinger(item.song.singer);
    setMovie(item.song.movie || "");
    setComposer(item.song.composer);
    setGenre(item.song.genre);
    if (!defaultRaagaId) setRaaagaId(item.raagaId);
    setShowSuggestions(false);
    setYtResults([]);
    if (ytDebounce.current) clearTimeout(ytDebounce.current);
    // Auto-search YouTube for the picked song
    runYTSearch([item.song.title, item.song.singer, item.song.movie].filter(Boolean).join(" "));
  }

  function pickResult(r: YtResult) {
    setPickedVideo(r);
    hasPickedRef.current = true;
    setYtResults([]);
    setTitle(r.title);
    const q = r.title.toLowerCase();
    const match = ALL_KNOWN_SONGS.find(({ song }) =>
      q.includes(song.title.toLowerCase()) || song.title.toLowerCase().includes(q.split(" ")[0])
    );
    if (match) {
      setSinger(match.song.singer);
      setMovie(match.song.movie || "");
      setComposer(match.song.composer);
      setGenre(match.song.genre);
      if (!defaultRaagaId && !raaagaId) setRaaagaId(match.raagaId);
    } else {
      // Unknown song — use channel as singer hint; leave movie/composer for user to fill
      setSinger(r.channel);
      setMovie("");
      setComposer("");
    }
  }

  async function handleAdd() {
    if (!raaagaId || !title || !singer) return;
    setSubmitting(true);
    const song: Song = {
      id: `${raaagaId}-extra-${Date.now()}`,
      title,
      singer,
      movie: movie || undefined,
      composer,
      genre,
      youtubeId: pickedVideo?.videoId,
      youtubeQuery: [title, singer, movie].filter(Boolean).join(" "),
    };
    // Save to Supabase as pending (admin review)
    await govDb.from("melodic_song_requests").insert({
      raaga_id: raaagaId,
      title,
      singer,
      movie: movie || null,
      composer,
      genre,
      youtube_id: pickedVideo?.videoId || null,
      youtube_query: song.youtubeQuery,
      status: "pending",
    });
    // Also show locally immediately for the submitter
    onAdd(raaagaId, song);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { onCancel(); }, 2500);
  }

  const canAdd = raaagaId && title.trim() && singer.trim();

  if (submitted) {
    return (
      <div className="border border-violet-400/40 rounded-xl bg-violet-500/5 p-4 text-center py-8">
        <p className="text-sm font-semibold text-violet-600">Song submitted!</p>
        <p className="text-xs text-muted-foreground mt-1">It's visible on your screen now. Admin will review for everyone.</p>
      </div>
    );
  }

  return (
    <div className="border border-violet-400/40 rounded-xl bg-violet-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">Add new / alternate version</p>
        <span className="text-[10px] text-muted-foreground/60 italic max-w-[180px] text-right leading-tight">
          Autofilled fields are suggestions — please verify before adding
        </span>
      </div>

      {/* Raaga picker — only shown in global modal mode */}
      {!defaultRaagaId && (
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Raaga *</label>
          <select
            value={raaagaId}
            onChange={e => setRaaagaId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400"
          >
            <option value="">Select raaga…</option>
            {raagas.map(r => <option key={r.id} value={r.id}>{r.name} ({r.hindiName})</option>)}
          </select>
        </div>
      )}

      {/* Song title — autosuggest + auto YouTube trigger */}
      <div className="relative">
        <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">
          Song title *
        </label>
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Start typing — YouTube loads automatically…"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400"
        />
        {showSuggestions && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background border border-violet-400/40 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map(({ song, raagaId, raagaName }) => (
              <button
                key={song.id}
                onMouseDown={() => pickSuggestion({ song, raagaId, raagaName })}
                className="w-full text-left px-3 py-2 hover:bg-violet-500/10 transition-colors border-b border-border/30 last:border-0"
              >
                <p className="text-xs font-medium text-foreground">{song.title}</p>
                <p className="text-[10px] text-muted-foreground">{song.singer}{song.movie ? ` · ${song.movie}` : ""} · <span className="text-violet-500">{raagaName}</span></p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* YouTube search — always visible, directly below title */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => runYTSearch([title, singer, movie].filter(Boolean).join(" ") || title)}
            disabled={!title.trim() && !singer.trim()}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-40 transition-colors"
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            {searching ? "Searching YouTube…" : "Search YouTube for this song"}
          </button>
          {pickedVideo && (
            <span className="text-[10px] text-violet-500 truncate max-w-[140px]">✓ {pickedVideo.title}</span>
          )}
        </div>

        {/* YouTube results */}
        {ytResults.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wide">Pick a version</p>
            {ytResults.map(r => (
              <button key={r.videoId} onClick={() => pickResult(r)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-violet-500/10 transition-colors text-left group border border-border/40">
                <img src={r.thumbnail} alt={r.title} className="w-14 h-9 rounded object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium line-clamp-1 group-hover:text-violet-600 transition-colors">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.channel}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Picked video — stays visible, can swap */}
        {pickedVideo && ytResults.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-400/30">
            <Play className="w-3 h-3 text-violet-600 fill-violet-600 shrink-0" />
            <p className="text-xs text-violet-600 dark:text-violet-400 truncate flex-1">{pickedVideo.title}</p>
            <button onClick={() => { setPickedVideo(null); hasPickedRef.current = false; runYTSearch(title); }} className="text-[10px] text-muted-foreground hover:text-rose-500 shrink-0">change</button>
          </div>
        )}
      </div>

      {/* Metadata fields — focus-based autosuggest (clears on click-away) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Singer */}
        <div className="relative">
          <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Singer *</label>
          <input value={singer} onChange={e => setSinger(e.target.value)}
            onFocus={() => setActiveSuggest("singer")}
            onBlur={() => setTimeout(() => setActiveSuggest(null), 150)}
            placeholder="e.g. Lata Mangeshkar"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400" />
          {activeSuggest === "singer" && singerSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-background border border-violet-400/30 rounded-lg shadow-md overflow-hidden">
              {singerSuggestions.map(s => (
                <button key={s} onMouseDown={() => { setSinger(s); setActiveSuggest(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-violet-500/10 border-b border-border/20 last:border-0 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Movie */}
        <div className="relative">
          <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Movie (optional)</label>
          <input value={movie} onChange={e => setMovie(e.target.value)}
            onFocus={() => setActiveSuggest("movie")}
            onBlur={() => setTimeout(() => setActiveSuggest(null), 150)}
            placeholder="e.g. Mughal-E-Azam"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400" />
          {activeSuggest === "movie" && movieSuggestions.filter(Boolean).length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-background border border-violet-400/30 rounded-lg shadow-md overflow-hidden">
              {movieSuggestions.filter(Boolean).map(s => (
                <button key={s} onMouseDown={() => { setMovie(s); setActiveSuggest(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-violet-500/10 border-b border-border/20 last:border-0 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="relative">
          <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Composer</label>
          <input value={composer} onChange={e => setComposer(e.target.value)}
            onFocus={() => setActiveSuggest("composer")}
            onBlur={() => setTimeout(() => setActiveSuggest(null), 150)}
            placeholder="e.g. Naushad"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400" />
          {activeSuggest === "composer" && composerSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-background border border-violet-400/30 rounded-lg shadow-md overflow-hidden">
              {composerSuggestions.map(s => (
                <button key={s} onMouseDown={() => { setComposer(s); setActiveSuggest(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-violet-500/10 border-b border-border/20 last:border-0 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Genre */}
        <div>
          <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Genre</label>
          <select value={genre} onChange={e => setGenre(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-400">
            <option value="Film">Film</option>
            <option value="Hindustani Classical">Hindustani Classical</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={handleAdd} disabled={!canAdd || submitting}
          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
          Add to {defaultRaagaId ? raagas.find(r => r.id === defaultRaagaId)?.name : (raaagaId ? raagas.find(r => r.id === raaagaId)?.name : "Raaga")}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Admin PIN ─────────────────────────────────────────────────────────────────
const ADMIN_PIN = "PRL2026";

interface SongRequest {
  id: string;
  raaga_id: string;
  title: string;
  singer: string;
  movie: string | null;
  composer: string | null;
  genre: string;
  youtube_id: string | null;
  status: string;
  created_at: string;
}

function AdminPanel({ raagas, onApprove }: { raagas: Raaga[]; onApprove: (raaagaId: string, song: Song) => void }) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [editRaaga, setEditRaaga] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await govDb.from("melodic_song_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((data as SongRequest[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(req: SongRequest) {
    const raaagaId = editRaaga[req.id] || req.raaga_id;
    await govDb.from("melodic_song_requests").update({ status: "approved", raaga_id: raaagaId }).eq("id", req.id);
    const song: Song = {
      id: `${raaagaId}-db-${req.id.slice(0, 8)}`,
      title: req.title,
      singer: req.singer,
      movie: req.movie || undefined,
      composer: req.composer || "",
      genre: req.genre as Song["genre"],
      youtubeId: req.youtube_id || undefined,
      youtubeQuery: [req.title, req.singer, req.movie].filter(Boolean).join(" "),
    };
    onApprove(raaagaId, song);
    await load();
  }

  async function reject(id: string) {
    await govDb.from("melodic_song_requests").update({ status: "rejected" }).eq("id", id);
    await load();
  }

  return (
    <div className="border border-amber-400/40 rounded-xl bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Admin · Song Requests
        </p>
        <button onClick={load} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          ↻ Refresh
        </button>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!loading && requests.length === 0 && (
        <p className="text-xs text-muted-foreground">No pending requests.</p>
      )}
      {!loading && requests.map(req => (
        <div key={req.id} className="rounded-lg border border-border/60 bg-background p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{req.title}</p>
              <p className="text-[10px] text-muted-foreground">{req.singer}{req.movie ? ` · ${req.movie}` : ""}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">{new Date(req.created_at).toLocaleDateString()}</span>
          </div>
          {/* Raaga edit */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Raaga</label>
            <select
              value={editRaaga[req.id] ?? req.raaga_id}
              onChange={e => setEditRaaga(prev => ({ ...prev, [req.id]: e.target.value }))}
              className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs outline-none focus:border-violet-400"
            >
              {raagas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(req)}
              className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors">
              ✓ Approve
            </button>
            <button onClick={() => reject(req.id)}
              className="px-3 py-1.5 rounded border border-rose-300 text-rose-600 text-[11px] font-semibold hover:bg-rose-50 transition-colors">
              ✗ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Raaga card ────────────────────────────────────────────────────────────────
function RaagaCard({
  raaga, index, selectedIds, onSelect, extraSongs, onAddSong, allRaagas,
}: {
  raaga: Raaga;
  index: number;
  selectedIds: Record<string, string>;
  onSelect: (songId: string, videoId: string) => void;
  extraSongs: Song[];
  onAddSong: (raaagaId: string, song: Song) => void;
  allRaagas: Raaga[];
}) {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const allSongs = [...raaga.songs, ...extraSongs];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAddForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <motion.div
      ref={cardRef}
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
          <span className="text-[10px] font-mono text-muted-foreground/50">{allSongs.length}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3">
          {allSongs.map(s => (
            <SongRow
              key={s.id}
              song={s}
              selectedId={selectedIds[s.id]}
              onSelect={(videoId) => onSelect(s.id, videoId)}
            />
          ))}

          {showAddForm ? (
            <AddSongForm
              raagas={allRaagas}
              defaultRaagaId={raaga.id}
              onAdd={onAddSong}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-violet-400 hover:text-violet-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add new or alternate version
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Static preview (shown when page is locked) ────────────────────────────────
const PREVIEW_CARDS = [
  { name: "Bhairav",  hindi: "भैरव",       time: "Dawn",       mood: "Devotional, Austere",    song: "Piya Bin Nahin Aavat Chain",        singer: "Mohammed Rafi",    movie: "Kohinoor",                   composer: "Naushad",     genre: "Film" },
  { name: "Yaman",    hindi: "यमन",        time: "Evening",    mood: "Romantic, Peaceful",     song: "Kahe Tarse Naina",                  singer: "Lata Mangeshkar",  movie: "Baiju Bawra",                composer: "Naushad",     genre: "Film" },
  { name: "Malkauns", hindi: "मालकौंस",    time: "Late Night", mood: "Profound, Meditative",   song: "Man Tarpat Hari Darshan Ko Aaj",    singer: "Mohammed Rafi",    movie: "Baiju Bawra",                composer: "Naushad",     genre: "Film" },
  { name: "Bageshri", hindi: "बागेश्री",   time: "Late Afternoon", mood: "Romantic, Longing",  song: "Kaun Aaya Mere Man Ke Dware",       singer: "Lata Mangeshkar",  movie: "Dil Hi Toh Hai",             composer: "Roshan",      genre: "Film" },
];

const TIME_CHIPS = ["All", "Dawn", "Morning", "Afternoon", "Evening", "Night", "Late Night"];

const RaagaPreviewCard = ({ r, blur }: { r: typeof PREVIEW_CARDS[0]; blur?: boolean }) => (
  <div style={{ filter: blur ? "blur(4px)" : "none", userSelect: blur ? "none" : "auto", pointerEvents: blur ? "none" : "auto" }}>
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎵</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r.name}</span>
            <span style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{r.hindi}</span>
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.time} · {r.mood}</div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 16px", background: "#fafaf9" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{r.song}</div>
        <div style={{ fontSize: 11, color: "#64748b" }}>{r.singer}{r.movie ? ` · ${r.movie}` : ""} · {r.composer}</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, background: r.genre === "Film" ? "#fef3c7" : "#ede9fe", color: r.genre === "Film" ? "#92400e" : "#6d28d9", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{r.genre}</span>
          <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>▶ Find & Play</span>
        </div>
      </div>
    </div>
  </div>
);

const MelodicPreview = () => (
  <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#faf9ff", minHeight: "100vh" }}>
    <DiagonalWatermark />

    {/* Sticky header — sits below PageGate banner (~40px) */}
    <div style={{ background: "#0f172a", color: "#fff", padding: "20px 32px", position: "sticky", top: 40, zIndex: 90 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <a href="/#projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", textDecoration: "none", marginBottom: 10, fontWeight: 400 }}>
          ← Back to Portfolio
        </a>
        <div style={{ fontSize: 10, color: "#a78bfa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Hindustani Classical · Film Raagas
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎵</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Melodic Framework</h1>
            <p style={{ margin: "2px 0 0", color: "#a78bfa", fontSize: 12, fontStyle: "italic" }}>(Raaga)</p>
          </div>
        </div>
        <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13 }}>
          Hindustani classical and film raagas — one canonical song per raaga, inline playback, and lyrics.
        </p>
      </div>
    </div>

    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 32px" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[{ label: "Raagas", value: "28" }, { label: "Genres", value: "2" }, { label: "Times of Day", value: "10" }].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Time filter chips — static */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {TIME_CHIPS.map((t, i) => (
          <span key={t} style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 20,
            background: i === 0 ? "#7c3aed" : "transparent",
            color: i === 0 ? "#fff" : "#64748b",
            border: `1px solid ${i === 0 ? "#7c3aed" : "#e2e8f0"}`,
          }}>{t}</span>
        ))}
      </div>

      {/* Raaga grid — 2 clear, 2 blurred */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, position: "relative" }}>
        <RaagaPreviewCard r={PREVIEW_CARDS[0]} />
        <RaagaPreviewCard r={PREVIEW_CARDS[1]} />
        <RaagaPreviewCard r={PREVIEW_CARDS[2]} blur />
        <RaagaPreviewCard r={PREVIEW_CARDS[3]} blur />
        {/* Fade-out gradient over blurred row */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, transparent, rgba(250,249,255,0.98))", borderRadius: "0 0 12px 12px" }} />
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
        + 24 more raagas · Search · Inline YouTube playback · Lyrics
      </p>
      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 24 }}>
        © 2026 Preethi Raghuveeran · Melodic Framework · Private
      </p>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MelodicFramework() {
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Record<string, string>>({});
  const [extraSongs, setExtraSongs] = useState<Record<string, Song[]>>({});
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    // Load approved songs from Supabase
    govDb.from("melodic_song_requests")
      .select("*")
      .eq("status", "approved")
      .then(({ data }) => {
        if (!data) return;
        const grouped: Record<string, Song[]> = {};
        for (const req of data as any[]) {
          const song: Song = {
            id: `db-${req.id.slice(0, 8)}`,
            title: req.title,
            singer: req.singer,
            movie: req.movie || undefined,
            composer: req.composer || "",
            genre: req.genre as Song["genre"],
            youtubeId: req.youtube_id || undefined,
            youtubeQuery: [req.title, req.singer, req.movie].filter(Boolean).join(" "),
          };
          grouped[req.raaga_id] = [...(grouped[req.raaga_id] || []), song];
        }
        setExtraSongs(grouped);
      });
  }, []);

  function handleSelect(songId: string, videoId: string) {
    setSelectedIds(prev => ({ ...prev, [songId]: videoId }));
  }

  function handleAddSong(raaagaId: string, song: Song) {
    setExtraSongs(prev => ({
      ...prev,
      [raaagaId]: [...(prev[raaagaId] || []), song],
    }));
  }

  function tryAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) { setAdminMode(true); setPinInput(""); setPinError(false); }
    else { setPinInput(""); setPinError(true); setTimeout(() => setPinError(false), 2000); }
  }

  const times = ["All", ...TIME_ORDER.filter(t => DEMO_RAAGAS.some(r => r.time === t))];

  const filtered = DEMO_RAAGAS.filter(r => {
    const matchesTime = timeFilter === "All" || r.time === timeFilter;
    const allSongs = [...r.songs, ...(extraSongs[r.id] || [])];
    const matchesQuery = !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.hindiName.includes(query) ||
      r.mood?.toLowerCase().includes(query.toLowerCase()) ||
      r.time?.toLowerCase().includes(query.toLowerCase()) ||
      r.season?.toLowerCase().includes(query.toLowerCase()) ||
      allSongs.some(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.singer.toLowerCase().includes(query.toLowerCase()) ||
        s.movie?.toLowerCase().includes(query.toLowerCase()) ||
        s.composer.toLowerCase().includes(query.toLowerCase())
      );
    return matchesTime && matchesQuery;
  });

  return (
    <PageGate previewContent={<MelodicPreview />} backTo="/#projects">
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
          <span className="text-xs text-muted-foreground font-mono">{DEMO_RAAGAS.length} raagas</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8 items-start">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

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

          {/* Add Song — primary CTA */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
            {showGlobalAdd ? (
              <div className="border border-violet-400/40 rounded-xl bg-violet-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-violet-700 dark:text-violet-300">Add a song to any raaga</p>
                  <button onClick={() => setShowGlobalAdd(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
                </div>
                <AddSongForm
                  raagas={DEMO_RAAGAS}
                  onAdd={(id, song) => { handleAddSong(id, song); setShowGlobalAdd(false); }}
                  onCancel={() => setShowGlobalAdd(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowGlobalAdd(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-400/50 text-violet-600 hover:bg-violet-500/5 hover:border-violet-500 transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" /> Add a song to any raaga
              </button>
            )}
          </motion.div>

          {/* Search + time filter (compact) */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filter raagas…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs outline-none focus:border-violet-400 transition-colors"
                />
              </div>
              {(query || timeFilter !== "All") && (
                <span className="text-xs text-muted-foreground">{filtered.length} raaga{filtered.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            {/* Time-of-day chips */}
            <div className="flex flex-wrap gap-1.5">
              {times.map(t => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    timeFilter === t
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
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
                  extraSongs={extraSongs[r.id] || []}
                  onAddSong={handleAddSong}
                  allRaagas={DEMO_RAAGAS}
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

        {/* ── Right sidebar: Comments + Admin + visitor counter ── */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-6">
            <div className="border border-border/50 rounded-2xl bg-card p-4">
              <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-4">Notes & Comments</p>
              <Comments hideAdminPin />
            </div>

            {/* Admin panel — single PIN entry, below comments */}
            {adminMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-mono text-amber-600 uppercase tracking-wide">Admin mode</p>
                  <button onClick={() => setAdminMode(false)} className="text-[10px] text-muted-foreground hover:text-foreground">✕ Exit</button>
                </div>
                <AdminPanel raagas={DEMO_RAAGAS} onApprove={handleAddSong} />
              </div>
            ) : (
              <form onSubmit={tryAdmin} className="flex gap-1.5 items-center">
                <input
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); tryAdmin(e as any); } }}
                  type="password"
                  placeholder="Admin PIN"
                  className={`w-24 px-2 py-1 rounded border bg-transparent text-[10px] outline-none transition-colors text-muted-foreground/50 placeholder:text-muted-foreground/30 ${pinError ? "border-rose-400" : "border-border/40 focus:border-primary/40"}`}
                />
                <button type="submit" className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">→</button>
              </form>
            )}

            <div className="flex justify-end">
              <VisitorCounter />
            </div>
          </div>
        </div>

      </div>
    </div>
    </PageGate>
  );
}
