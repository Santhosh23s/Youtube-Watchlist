import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Playlist = { id: string; name: string }

export default function PlaylistsIndex() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      const { data, error } = await supabase.from('playlists').select('id,name').order('created_at', { ascending: false })
      if (error) setError(error.message)
      setPlaylists(data ?? [])
    }
    load()
  }, [])

  return (
    <div className="shell grid" style={{ gap: '1rem' }}>
      <div className="card grid" style={{ gap: '0.75rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Playlists</h2>
          <Link className="button secondary" to="/admin">Create</Link>
        </div>
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
        {playlists.length === 0 && !error && <p className="tagline" style={{ margin: 0 }}>No playlists yet. Create one in Admin.</p>}
        <div className="card-grid">
          {playlists.map(p => (
            <Link key={p.id} className="mini-card" to={`/playlists/${p.id}`}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="tagline">Playlist</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

