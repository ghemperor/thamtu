# Deception: Murder in Hong Kong (Web Version)

## 📦 Import to Vercel / Render

This project is a **Node.js + Socket.io** application.

### Important Note for Vercel Users
Vercel is designed for Serverless functions. Socket.io requires a **persistent** server to keep connections alive.
*   **Vercel**: May restrict WebSocket connections or reset the game state (players list) frequently because the server "sleeps" when inactive.
*   **Recommended**: Use **Render (Web Service)**, **Fly.io**, **Railway**, or **Glitch**. These support persistent Node.js servers perfectly for free/cheap.

### How to Deploy (GitHub)

1.  **Initialize Git**:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  **Push to GitHub**:
    *   Create a new repository on GitHub.
    *   Run the commands provided by GitHub (e.g., `git remote add origin ...`, `git push -u origin master`).
3.  **Deploy**:
    *   Go to Vercel/Render dashboard.
    *   Import via GitHub.
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`

## 🛠️ Local Run
1.  `npm install`
2.  `node server.js`
3.  Open `http://localhost:3000`
