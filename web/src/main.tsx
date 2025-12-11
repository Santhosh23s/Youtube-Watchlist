import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Playlist from './pages/Playlist'
import Watch from './pages/Watch'
import PlaylistsIndex from './pages/PlaylistsIndex'
import Browse from './pages/Browse'

const router = createBrowserRouter(
  [
    { path: '/', element: <App /> },
    { path: '/browse', element: <Browse /> },
    { path: '/playlists', element: <PlaylistsIndex /> },
    { path: '/login', element: <Login /> },
    { path: '/admin', element: <Admin /> },
    { path: '/playlists/:id', element: <Playlist /> },
    { path: '/watch/:videoId', element: <Watch /> },
  ],
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

