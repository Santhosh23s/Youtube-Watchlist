import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Video = { id: string; title: string; youtube_id: string }

export default function Playlist() {
  const { id } = useParams()
  const [videos, setVideos] = useState<Video[]>([])
  const [playlistName, setPlaylistName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setError(null)
      const { data: playlist, error: errPl } = await supabase.from('playlists').select('name').eq('id', id).single()
      if (errPl) {
        setError('Playlist not found')
        return
      }
      setPlaylistName(playlist?.name ?? '')
      const { data, error: errVid } = await supabase
        .from('playlist_videos')
        .select('videos(id,title,youtube_id)')
        .eq('playlist_id', id)
        .order('position', { ascending: true })
      if (errVid) {
        setError('Could not load videos')
        return
      }
      const mapped = (data ?? []).map((row: any) => row.videos).filter(Boolean)
      setVideos(mapped)
    }
    if (id) load()
  }, [id])

  return (
    <div className="shell grid" style={{ gap: '1rem' }}>
      <div className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>{playlistName || 'Playlist'}</h2>
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
        {videos.length === 0 && !error ? (
          <p style={{ margin: 0, color: '#c4c9e5' }}>No videos in this playlist yet.</p>
        ) : (
          <ul className="grid" style={{ gap: '0.75rem', margin: 0, paddingLeft: '1rem' }}>
            {videos.map(v => (
              <li key={v.id}>
                <Link className="pill" to={`/watch/${v.id}`}>{v.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

