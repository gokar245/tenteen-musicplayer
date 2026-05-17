# TenTeen 🎵

A premium, open-registration music streaming platform built with the MERN stack.

## Features

- **Open Registration**: Anyone can register and start listening.
- **User-Uploaded Music**: MP3, M4A, and WAV files uploaded by users. Auto-approved and instantly available.
- **Content Management**: Users can manage, edit, and delete their own uploaded songs.
- **Cloudinary Storage**: Audio and images stored in Cloudinary (configurable local fallback).
- **HTTP Byte-Range Streaming**: Proper audio seeking with 206 Partial Content.
- **Persistent Audio Player**: Music continues playing across page navigation.
- **Sleep Timer**: Set a timer to automatically pause music after a set duration.

- **Spotify-Inspired UI**: Sidebar + content + bottom player layout.
- **Apple-Like Smoothness**: Subtle animations and transitions.
- **Dynamic Colors**: Accent colors extracted from cover artwork.
- **No Ads, No Tracking**: Completely ad-free and private.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 5 |
| Routing | React Router 6 |
| Styling | Vanilla CSS (Custom Design System) |
| Backend | Node.js 20 + Express 4 |
| Database | MongoDB (Atlas Free Tier) |
| Auth | JWT |
| Upload | Multer |
| Storage | Cloudinary / Local |
| Audio Metadata | music-metadata |

## Color Palette

- **Background**: `#F1F6F9`
- **Dark Sections**: `#212A3E`
- **Cards/Surfaces**: `#394867`
- **Text/Icons**: `#9BA4B5`
- **Accent**: `#4a90d9` (Blue)
- **No Green** used anywhere in the app.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd TenTeen
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**
   ```bash
   # Create a .env file and edit it with your configuration
   # Ensure NODE_ENV=development for local testing
   ```

4. **Start server**
   ```bash
   npm run dev
   ```

5. **Install client dependencies** (new terminal)
   ```bash
   cd client
   npm install
   ```

6. **Start client**
   ```bash
   npm run dev
   ```

7. **Open app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Project Structure

```
TenTeen/
├── server/                 # Backend
│   ├── config/            # Database config
│   ├── middleware/        # Auth, validation, rate limiting
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Storage abstraction (Cloudinary)
│   └── index.js           # Entry point
│
├── client/                # Frontend
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # React components
│       │   ├── common/    # Buttons, spinners
│       │   ├── layout/    # Sidebar, TopBar, Player
│       │   └── music/     # Cards, rows, modals
│       ├── context/       # Auth & Audio providers
│       ├── pages/         # Route pages
│       ├── services/      # API client
│       └── styles/        # CSS design system
│
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Songs
- `GET /api/songs` - List songs
- `GET /api/songs/:id` - Get song details
- `PUT /api/songs/:id` - Update song details (owner only)
- `DELETE /api/songs/:id` - Delete song (owner only)
- `POST /api/songs/history` - Record playback
- `GET /api/songs/history/recent` - Get recent plays



### Artists
- `GET /api/artists` - List artists
- `GET /api/artists/:id` - Get artist details
- `PUT /api/artists/:id` - Update artist details (owner only)
- `DELETE /api/artists/:id` - Delete empty artist



### Stream
- `GET /api/stream/:songId` - Stream audio (supports byte-range)

### Upload
- `POST /api/upload/audio` - Upload song (supports cover and artist images)
- `POST /api/upload/image` - Upload standalone image

## Deployment

### Free Tier Options

| Service | Use For |
|---------|---------|
| Render | Backend hosting |
| Vercel | Frontend hosting |
| MongoDB Atlas | Database (M0 free) |
| Cloudinary | Audio/Image storage (25GB free) |

### Environment Variables

**Server (.env)**
```
# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key

# Server
PORT=5000
NODE_ENV=production
MAX_FILE_SIZE_MB=50

# Storage (local or cloudinary)
STORAGE_TYPE=cloudinary

# Cloudinary (required if STORAGE_TYPE=cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
```

**Client**
- No env needed (uses Vite proxy in dev, same-origin in prod)

## License

Private. All rights reserved.
