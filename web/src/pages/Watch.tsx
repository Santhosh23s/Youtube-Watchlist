import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Video = { id: string; title: string; youtube_id: string }

export default function Watch() {
  const { videoId } = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const progressRef = useRef<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [reminderAt, setReminderAt] = useState<string>('') // ISO from datetime-local

  useEffect(() => {
    const load = async () => {
      setError(null)
      const { data, error: err } = await supabase.from('videos').select('id,title,youtube_id').eq('id', videoId).single()
      if (err) {
        setError('Video not found')
        return
      }
      if (data) setVideo(data)
    }
    if (videoId) load()
  }, [videoId])

  const markProgress = async (completed = false) => {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id
    if (!userId || !videoId) return
    await supabase.from('watch_history').upsert({
      user_id: userId,
      video_id: videoId,
      watched_seconds: progressRef.current,
      completed,
    })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      progressRef.current += 10
      void markProgress(false)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const scheduleReminder = async () => {
    if (!reminderAt || !videoId) return
    const when = new Date(reminderAt)
    if (isNaN(when.getTime())) return setError('Pick a valid date/time')
    const { error: err } = await supabase.rpc('enqueue_video_reminder', {
      video_id: videoId,
      scheduled_at: when.toISOString(),
    })
    if (err) setError(err.message)
    else setError('Reminder scheduled')
  }

  if (error) {
    return (
      <div className="shell">
        <div className="card">
          <p style={{ color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!video) return <div className="shell"><div className="card">Loading...</div></div>

  return (
    <div className="shell grid" style={{ gap: '1rem' }}>
      <div className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>{video.title}</h2>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}`}
            title={video.title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="button" onClick={() => markProgress(true)}>Mark complete</button>
          <input
            className="input"
            type="datetime-local"
            value={reminderAt}
            onChange={e => setReminderAt(e.target.value)}
          />
          <button className="button secondary" onClick={scheduleReminder}>Schedule reminder</button>
        </div>
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
      </div>
    </div>
  )
}

