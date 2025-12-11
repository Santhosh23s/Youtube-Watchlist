import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="shell grid" style={{ gap: '1rem' }}>
      <div className="card grid" style={{ gap: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Login</h2>
        <div className="row">
          <button className="button" onClick={signIn}>Sign in with Google</button>
          <button className="button secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  )
}

