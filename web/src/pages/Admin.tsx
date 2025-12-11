import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Video = { id: string; title: string; youtube_id: string }
type Playlist = { id: string; name: string }

export default function Admin() {
  const [videos, setVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('')
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [position, setPosition] = useState<number>(1)

  useEffect(() => {
    const load = async () => {
      const { data: vids } = await supabase.from('videos').select('id,title,youtube_id').order('created_at', { ascending: false })
      const { data: pls } = await supabase.from('playlists').select('id,name').order('created_at', { ascending: false })
      setVideos(vids ?? [])
      setPlaylists(pls ?? [])
    }
    load()
  }, [])

  const extractYouTubeId = (link: string) => {
    try {
      const urlObj = new URL(link)
      if (urlObj.hostname.includes('youtu.be')) return urlObj.pathname.slice(1)
      if (urlObj.searchParams.get('v')) return urlObj.searchParams.get('v') || ''
      const parts = urlObj.pathname.split('/')
      const idx = parts.findIndex(p => p === 'embed')
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    } catch (_) {
      /* ignore */
    }
    return ''
  }

  const addVideo = async () => {
    const youtube_id = extractYouTubeId(url)
    if (!youtube_id || !title) return alert('Provide title and valid YouTube link')
    const { error } = await supabase.from('videos').insert({ title, youtube_id })
    if (error) return alert(error.message)
    setTitle('')
    setUrl('')
    const { data: vids } = await supabase.from('videos').select('id,title,youtube_id').order('created_at', { ascending: false })
    setVideos(vids ?? [])
  }

  const addPlaylist = async () => {
    if (!playlistName) return
    const { error } = await supabase.from('playlists').insert({ name: playlistName })
    if (error) return alert(error.message)
    setPlaylistName('')
    const { data: pls } = await supabase.from('playlists').select('id,name').order('created_at', { ascending: false })
    setPlaylists(pls ?? [])
  }

  const addToPlaylist = async () => {
    if (!selectedPlaylist || !selectedVideo) return alert('Pick a playlist and a video')
    const { error } = await supabase.from('playlist_videos').upsert({
      playlist_id: selectedPlaylist,
      video_id: selectedVideo,
      position,
    })
    if (error) return alert(error.message)
    alert('Added to playlist')
  }

  return (
    <div className="shell grid" style={{ gap: '1.5rem' }}>
      <header className="card">
        <h1 style={{ margin: 0 }}>Admin</h1>
        <p style={{ margin: 0, color: '#c4c9e5' }}>Add videos, playlists, and assign videos to playlists.</p>
      </header>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Add Video</h2>
        <div className="row">
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube link" style={{ minWidth: '280px' }} />
          <button className="button" onClick={addVideo}>Save</button>
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Create Playlist</h2>
        <div className="row">
          <input className="input" value={playlistName} onChange={e => setPlaylistName(e.target.value)} placeholder="Playlist name" />
          <button className="button" onClick={addPlaylist}>Save</button>
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Add Video to Playlist</h2>
        <div className="row">
          <select className="input" value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)}>
            <option value="">Select playlist</option>
            {playlists.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className="input" value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)}>
            <option value="">Select video</option>
            {videos.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
          <input className="input" type="number" min={1} value={position} onChange={e => setPosition(Number(e.target.value) || 1)} style={{ width: '100px' }} />
          <button className="button" onClick={addToPlaylist}>Add</button>
        </div>
      </section>

      <section className="card grid" style={{ gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Videos</h3>
        {videos.length === 0 ? (
          <p style={{ margin: 0, color: '#c4c9e5' }}>None yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {videos.map(v => (
              <li key={v.id}>{v.title} — <span className="pill">{v.youtube_id}</span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card grid" style={{ gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Playlists</h3>
        {playlists.length === 0 ? (
          <p style={{ margin: 0, color: '#c4c9e5' }}>None yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {playlists.map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

