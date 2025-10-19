# 📱 Mobile Access Setup with Ngrok

This guide helps you access your College Canteen app on your phone using ngrok.

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)
```bash
./start-ngrok.sh
```

### Option 2: Manual Setup

1. **Start Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

2. **Start Frontend** (Terminal 2):
```bash
cd frontend-user
npm run dev
```

3. **Start Ngrok for Frontend** (Terminal 3):
```bash
ngrok http 3000
```

4. **Optional: Start Ngrok for Backend** (Terminal 4):
```bash
cd backend
npm run ngrok
```

## 📱 Using on Your Phone

1. After starting ngrok, you'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

2. Copy the `https://abc123.ngrok.io` URL
3. Open it in your phone's browser
4. The app will work exactly like on your computer!

## 🔧 Configuration Details

### Backend Changes Made:
- ✅ CORS configured to allow all origins in development
- ✅ Socket.io configured for cross-origin requests
- ✅ Server listening on `0.0.0.0` (all network interfaces)

### Frontend Changes Made:
- ✅ Vite configured with `host: '0.0.0.0'`
- ✅ Added network development script
- ✅ Added ngrok script

### Environment Variables:
- Backend uses `NODE_ENV=development` for flexible CORS
- Frontend uses proxy configuration for API calls
- Socket.io connects through the same domain (no separate backend ngrok needed)

## 🐛 Troubleshooting

### If the app doesn't work on your phone:
1. Make sure both backend and frontend are running
2. Check that ngrok is showing the correct forwarding URL
3. Use the HTTPS URL (not HTTP) from ngrok
4. Clear your phone's browser cache if needed

### If API calls fail:
- The frontend proxy handles API routing automatically
- No need to expose backend separately unless debugging

### If socket connections fail:
- Socket.io will automatically connect through the same ngrok URL
- Check browser console for connection errors

## 📊 Monitoring

- Ngrok dashboard: http://localhost:4040
- View all active tunnels and request logs
- Monitor traffic and debug issues

## 🔒 Security Note

- This setup is for development only
- Ngrok URLs are temporary and change on restart
- Don't use this configuration in production