import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Video = { id: string; title: string; youtube_id: string }

export default function Browse() {
  const [videos, setVideos] = useState<Video[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      const { data, error } = await supabase.from('videos').select('id,title,youtube_id').order('created_at', { ascending: false })
      if (error) setError(error.message)
      setVideos(data ?? [])
    }
    load()
  }, [])

  return (
    <div className="shell grid" style={{ gap: '1rem' }}>
      <div className="card grid" style={{ gap: '0.75rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Browse Videos</h2>
        </div>
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
        {videos.length === 0 && !error && <p className="tagline" style={{ margin: 0 }}>No videos yet. Add some in Admin.</p>}
        <div className="card-grid">
          {videos.map(v => (
            <Link key={v.id} className="mini-card" to={`/watch/${v.id}`}>
              <div className="thumb">▶</div>
              <div style={{ fontWeight: 600 }}>{v.title}</div>
              <div className="tagline">YouTube • {v.youtube_id}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

