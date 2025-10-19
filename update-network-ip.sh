#!/bin/bash

# Get current network IP (excluding localhost)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect network IP address"
    exit 1
fi

echo "🔍 Detected network IP: $CURRENT_IP"

# Update frontend .env
echo "📱 Updating frontend configuration..."
sed -i '' "s|VITE_API_URL=http://[0-9.]*:5001/api|VITE_API_URL=http://$CURRENT_IP:5001/api|g" frontend-user/.env
sed -i '' "s|VITE_SOCKET_URL=http://[0-9.]*:5001|VITE_SOCKET_URL=http://$CURRENT_IP:5001|g" frontend-user/.env

# Update backend .env CORS
echo "🔧 Updating backend CORS configuration..."
sed -i '' "s|http://[0-9.]*:3000|http://$CURRENT_IP:3000|g" backend/.env

echo "✅ Configuration updated!"
echo ""
echo "📱 Access your app on phone at: http://$CURRENT_IP:3000"
echo "🔗 Backend API available at: http://$CURRENT_IP:5001"
echo ""
echo "🚀 Now restart your servers:"
echo "   Backend: cd backend && npm run dev"
echo "   Frontend: cd frontend-user && npm run dev:network"