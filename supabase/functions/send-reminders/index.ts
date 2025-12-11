import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const fromEmail = Deno.env.get('FROM_EMAIL')!
const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? 'https://yourapp.com'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  global: { headers: { 'x-client-info': 'edge-function-send-reminders' } },
})

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Resend error ${res.status}: ${errText}`)
  }
}

serve(async () => {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 1000 * 60 * 60) // last hour
  const { data: rows, error } = await supabase
    .from('notification_queue')
    .select('id, user_id, playlist_id, video_id, reason, scheduled_for, sent_at, user_profiles(email)')
    .eq('sent_at', null)
    .lte('scheduled_for', now.toISOString())
    .gte('scheduled_for', windowStart.toISOString())

  if (error) return new Response(error.message, { status: 500 })

  for (const row of rows ?? []) {
    const email = row.user_profiles?.email
    if (!email) continue
    const isVideo = !!row.video_id
    const subject = row.reason === 'incomplete_playlist'
      ? 'Keep watching your playlist'
      : isVideo ? 'Video reminder' : 'Video hub reminder'
    const link = isVideo
      ? `${appBaseUrl}/watch/${row.video_id}`
      : `${appBaseUrl}/playlists/${row.playlist_id ?? ''}`
    const html = isVideo
      ? `<p>Hi, you scheduled a reminder to watch a video.</p><p><a href="${link}">Open the video</a></p>`
      : `<p>Hi, you have videos waiting in your playlist.</p><p><a href="${link}">Continue watching</a></p>`
    try {
      await sendEmail(email, subject, html)
      await supabase
        .from('notification_queue')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id)
    } catch (e) {
      console.error('send failed', e)
    }
  }

  const { error: needErr } = await supabase.rpc('collect_incomplete_playlists')
  if (needErr) console.error('collect_incomplete_playlists error', needErr)

  return new Response('ok')
})

