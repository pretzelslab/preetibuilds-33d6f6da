import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Search, Plus, Play, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Raaga {
  id: string;
  name: string;
  hindiName: string;
  time?: string;      // e.g. "Morning", "Evening", "Night"
  season?: string;    // e.g. "Monsoon", "Spring"
  mood?: string;      // e.g. "Devotional", "Romantic", "Melancholic"
  songs: Song[];
}

interface Song {
  id: string;
  title: string;
  movie?: string;
  singer: string;
  composer: string;
  genre: "Hindustani Classical" | "Film";
  embedUrl?: string;  // YouTube embed URL
  lyrics?: string;    // stored lyrics
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
        embedUrl: "",
        lyrics: "",
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
        movie: "",
        singer: "K.L. Saigal",
        composer: "Traditional",
        genre: "Hindustani Classical",
        embedUrl: "",
        lyrics: "",
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
        title: "Vandemataram",
        movie: "Anand Math",
        singer: "Lata Mangeshkar",
        composer: "Hemant Kumar",
        genre: "Film",
        embedUrl: "",
        lyrics: "",
      },
    ],
  },
];

const GENRE_COLORS: Record<string, string> = {
  "Hindustani Classical": "bg-violet-100 text-violet-700",
  "Film": "bg-amber-100 text-amber-700",
};

// ── Components ─────────────────────────────────────────────────────────────────
function RaagaCard({ raaga }: { raaga: Raaga }) {
  const [open, setOpen] = useState(false);
  const song = raaga.songs[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border/60 rounded-2xl overflow-hidden bg-card"
    >
      {/* Header */}
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{raaga.name}</span>
              <span className="text-xs text-muted-foreground font-serif">{raaga.hindiName}</span>
            </div>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {raaga.time && <span className="text-[10px] text-muted-foreground">{raaga.time}</span>}
              {raaga.mood && <span className="text-[10px] text-muted-foreground">· {raaga.mood}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground/60">{raaga.songs.length} song{raaga.songs.length !== 1 ? "s" : ""}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border/50 px-5 py-4 space-y-4">
          {raaga.songs.map(s => (
            <div key={s.id} className="space-y-3">
              {/* Song meta */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.singer}{s.movie ? ` · ${s.movie}` : ""} · {s.composer}
                  </p>
                  <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${GENRE_COLORS[s.genre]}`}>
                    {s.genre}
                  </span>
                </div>
                <button className="shrink-0 w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center transition-colors">
                  <Play className="w-4 h-4 text-white fill-white" />
                </button>
              </div>

              {/* Embed placeholder */}
              {s.embedUrl ? (
                <iframe
                  src={s.embedUrl}
                  className="w-full rounded-xl"
                  height="80"
                  allow="autoplay"
                  title={s.title}
                />
              ) : (
                <div className="w-full h-16 rounded-xl border border-dashed border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Player — embed URL to be added</span>
                </div>
              )}

              {/* Lyrics */}
              <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Lyrics</span>
                  </div>
                  {!s.lyrics && (
                    <button className="text-[10px] text-violet-600 font-semibold hover:underline">Generate with AI</button>
                  )}
                </div>
                {s.lyrics ? (
                  <p className="text-xs leading-relaxed whitespace-pre-line">{s.lyrics}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Lyrics not yet added. Click Generate to create with AI.</p>
                )}
              </div>
            </div>
          ))}

          {/* Add song */}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-violet-400 hover:text-violet-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add another song for this raaga
          </button>
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
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Raaga
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎵</span>
            <div>
              <h1 className="text-3xl font-bold">Melodic Framework</h1>
              <p className="text-sm text-muted-foreground font-serif">(Raaga)</p>
            </div>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
            A curated library of Hindustani classical and film raagas — one canonical song per raaga, with embedded player, metadata, and AI-generated lyrics.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search raaga, song, singer, movie, composer…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-violet-400 transition-colors"
            />
          </div>
          {query && (
            <p className="text-xs text-muted-foreground mt-2">
              {filtered.length} raaga{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}
        </motion.div>

        {/* Raaga list */}
        <div className="space-y-3">
          {filtered.length ? (
            filtered.map(r => <RaagaCard key={r.id} raaga={r} />)
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No raagas match your search.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
