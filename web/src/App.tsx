import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

type Playlist = { id: string; name: string }
type Video = { id: string; title: string; youtube_id: string }

function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('playlists').select('id,name').order('created_at', { ascending: false })
      if (!error) setPlaylists(data ?? [])

      const { data: vids } = await supabase.from('videos').select('id,title,youtube_id').order('created_at', { ascending: false }).limit(6)
      setVideos(vids ?? [])
    }
    load()
  }, [])

  const heroVideo = videos[0]
  const featuredPlaylists = playlists.slice(0, 4)
  const trendingVideos = videos.slice(0, 4)
  const browseVideos = videos.slice(0, 8)

  return (
    <div className="shell grid" style={{ gap: '1.25rem' }}>
      <header className="hero">
        <div className="hero-grid">
          <div className="grid" style={{ gap: '0.75rem' }}>
            <div className="hstack" style={{ gap: '0.5rem' }}>
              <span className="pill">Video Hub</span>
              <span className="pill">Playlists</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>Your Video Hub for Learning & Entertainment</h1>
            <p className="tagline">Discover curated playlists, watch your favorite videos, and track your progress.</p>
            <div className="hero-buttons">
              <Link className="button" to={heroVideo ? `/watch/${heroVideo.id}` : '/browse'}>Start Watching</Link>
              <Link className="button secondary" to="/playlists">Browse Playlists</Link>
            </div>
          </div>
          <div className="media-thumb">
            {heroVideo ? (
              <iframe
                src={`https://www.youtube.com/embed/${heroVideo.youtube_id}`}
                title={heroVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="hstack" style={{ justifyContent: 'center', height: '100%', color: '#c4c9e5' }}>Add a video to preview</div>
            )}
          </div>
        </div>
      </header>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <div className="hstack" style={{ justifyContent: 'space-between' }}>
          <h3 className="section-title">Trending Now</h3>
          <Link className="button secondary" to="/browse">View All</Link>
        </div>
        <div className="card-grid">
          {trendingVideos.map(v => (
            <Link key={v.id} className="mini-card" to={`/watch/${v.id}`}>
              <div className="thumb">▶</div>
              <div>
                <div style={{ fontWeight: 600 }}>{v.title}</div>
                <div className="tagline">YouTube • {v.youtube_id}</div>
              </div>
            </Link>
          ))}
          {trendingVideos.length === 0 && <p className="tagline">Add videos to see them here.</p>}
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <div className="hstack" style={{ justifyContent: 'space-between' }}>
          <h3 className="section-title">Featured Playlists</h3>
          <Link className="button secondary" to="/playlists">View All</Link>
        </div>
        <div className="card-grid">
          {featuredPlaylists.map(p => (
            <Link key={p.id} className="mini-card" to={`/playlists/${p.id}`}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="tagline">Playlist</div>
            </Link>
          ))}
          {featuredPlaylists.length === 0 && <p className="tagline">Create a playlist in Admin.</p>}
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <h3 className="section-title">Browse Videos</h3>
        <div className="card-grid">
          {browseVideos.map(v => (
            <Link key={v.id} className="mini-card" to={`/watch/${v.id}`}>
              <div className="thumb">▶</div>
              <div style={{ fontWeight: 600 }}>{v.title}</div>
              <div className="tagline">YouTube • {v.youtube_id}</div>
            </Link>
          ))}
          {browseVideos.length === 0 && <p className="tagline">Add videos to browse.</p>}
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.5rem' }}>
        <h3 className="section-title">Reminders & Schedule</h3>
        <p className="tagline" style={{ margin: 0 }}>
          Email reminders are handled by the Supabase Edge Function (send-reminders) you deployed. Scheduling is configured in Supabase
          (cron), not in the UI. To adjust, run: <code>supabase edge-functions schedule create --function send-reminders --schedule "0 * * * *"</code>
        </p>
      </section>
    </div>
  )
}

export default App

