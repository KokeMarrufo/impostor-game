# Impostor - Social Deduction Game 🎭

A real-time multiplayer web game where players must identify the impostor among them through discussion and voting.

## 🎮 How to Play

1. **Create a Room**: One player creates a room and becomes the admin
2. **Join**: Other players join using the room code (minimum 3 players)
3. **Configure**: Admin sets the number of rounds and adds secret words
4. **Play**: Each round, one random player is the impostor
   - Most players see the secret word
   - The impostor sees "IMPOSTOR" instead
5. **Discuss**: Players discuss (via video call or in-person) to figure out who doesn't know the word
6. **Vote**: All players vote for who they think is the impostor
7. **Score**: If the impostor is caught, others get a point. If not, the impostor gets a point

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (React)
- **Real-time**: Socket.io
- **Backend**: Node.js + Express
- **Styling**: Vanilla CSS

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🌐 Features

- ✅ Real-time synchronization across all players
- ✅ Responsive mobile-first design
- ✅ Beautiful dark theme with smooth animations
- ✅ Card reveal with 3D flip animation
- ✅ Automatic role assignment
- ✅ Voting system
- ✅ Score tracking across rounds
- ✅ Admin controls for game management

## 🎯 Game States

1. **Lobby** - Players join and admin configures game
2. **Playing** - Players reveal their cards
3. **Voting** - Players vote for the impostor
4. **Round End** - Results shown and scores updated
5. **Game End** - Final winner announced

## 🔧 Environment Variables

No environment variables required for basic functionality.

## 📱 Device Support

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablet devices

## 📄 License

MIT

## 🤝 Contributing

Feel free to open issues or submit pull requests!

---

Made with ❤️ for game nights with friends
