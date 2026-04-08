# 5x5 Mini Shogi Online

*This project has been created as part of the 42 curriculum by <okaname>, <mkuida>, <tishihar>, <kosakats>.*

## 📝 Description

**5x5 Mini Shogi Online** is a real-time, web-based project that brings the traditional Japanese game of Shogi into a fast-paced, modern 3D environment. The goal was to build a robust Single Page Application (SPA) that supports multiplayer competition, AI training, and a complete social ecosystem for players.

### Key Features
- **Immersive 3D Graphics**: Fully interactive board using Three.js and Blender models.
- **Real-time Engine**: Instant move synchronization via WebSockets.
- **Secure Authentication**: OAuth and salted hashing for user management.
- **Spectator Experience**: Live match watching for the community.
- **AI Practice**: Play against a computer opponent.

---

## 🚀 Instructions

### Prerequisites
- **Docker & Docker Compose**: Necessary for running the containerized environment.
- **GNU Make**: To use the simplified automation commands.
- **RAM**: Minimum 2GB allocated to Docker.

### Local Setup & Deployment
1. **Repository Cloning**:
   ```bash
   git clone <repository-url>
   cd transcendence
   ```

2. **Environment Configuration**:
   Create a `.env` file at the root:
   ```bash
   cp .env.example .env
   ```
   *Required variables: `DATABASE_URL`, `AUTH_SECRET`, `POSTGRES_PASSWORD`.*

3. **Running the Project (Makefile)**:
   The project includes a `Makefile` to simplify Docker operations.

   - **Production Mode** (Standard 42 evaluation):
     ```bash
     make prod
     ```
   - **Development Mode** (with hot-reload):
     ```bash
     make test
     ```
   - **Stop Services**:
     ```bash
     make down-prod  # Stop production environment
     make down-test  # Stop development environment
     ```

4. **Access**:
   The application is accessible at `http://localhost:8080`.

---

## 🛠 Technical Stack

### Technologies & Frameworks
- **Frontend**: **Next.js 14 (App Router)** - Chosen for its strong SEO support, routing efficiency, and React integration.
- **Backend**: **Node.js with Next.js API Routes** - Provides a unified development experience and fast cold starts.
- **3D Engine**: **React Three Fiber (Three.js)** & **Blender** - Used for 3D modeling and high-performance board/piece rendering.
- **Real-time**: **Socket.IO** - Enables bidirectional communication for gameplay actions and chat.
- **ORM**: **Prisma** - Ensures type safety between the database and the application logic.

### Technical Decision Justification
We opted for a **T3-style stack** (Next.js + Prisma + TypeScript) because it minimizes runtime errors through strict typing across the network layer. PostgreSQL was chosen over NoSQL to maintain strict data integrity for match history and stats.

---

## 📊 Database Schema

The schema maintains relational integrity via Prisma on **PostgreSQL**:

- **User**: `id (UUID)`, `email`, `passwordHash`, `totalMatches`, `wins`.
- **Match**: `id (UUID)`, `blackUserId (FK)`, `whiteUserId (FK)`, `winnerUserId (FK)`.
- **Friendship**: `requesterId (FK)`, `addresseeId (FK)`, `status` (PENDING, ACCEPTED).
- **Session/Account**: Managed for OAuth persistence and JWT-based sessions.

---

## 📋 Features List & Assignees

- **Core Shogi Logic**: `<okaname>` - Implementation of move validation, promotion, and captured pieces.
- **3D Board Rendering**: `<kosakats>` - 3D model creation and animation hooks.
- **Real-time Synchronization**: `<okaname>` - WebSocket server handling room management and move broadcasting.
- **User Management & Auth**: `<mkuida>` - Signup/Login flow, profile editing, and friend request system.
- **Spectator UI**: `<okaname>` / `<kosakats>` - Global state management for non-playing viewers.
- **AI Opponent**: `<okaname>` - Move-search algorithm for offline play.
- **HTTPS**: `<tishihar>` - Implementation of secure HTTPS communication.
- **OAuth**: `<mkuida>` - Implementation of OAuth authentication.
- **TOS & Privacy Policy**: `<ishihar>` - Implementation of Terms of Service and Privacy Policy.

---

## 🧩 Modules & Point Calculation

Total Points: **16**

| Module | Type | Implementation Detail | Assignee | Points |
|---|---|---|---|---|
| **Full-stack Framework** | Major | Next.js handles both SSR and Backend API. | `<okaname>` / `<mkuida>` / `<kosakats>` / `<ishihar>` | 2 |
| **Real-time Features** | Major | WebSocket for match status updates. | `<okaname>` | 2 |
| **Interactive Socials** | Major | Profile management and Friends list. | `<mkuida>` | 2 |
| **Public API** | Major | 5+ secured REST endpoints for user stats. | `<kosakats>` | 2 |
| **AI Opponent** | Major | Move-search algorithm for offline play. | `<okaname>` | 2 |
| **Remote Players** | Major | Cross-device real-time gameplay. | `<okaname>` | 2 |
| **Advanced 3D Graphics** | Major | Three.js piece promotion animations. | `<kosakats>` | 2 |
| **Spectator mode** | Minor | Viewers support for active rooms. | `<okaname>` / `<kosakats>` | 1 |
| **Game Statistics** | Minor | Database tracking for user Elo rating. | `<okaname>` / `<mkuida>` | 1 |

---

## 👥 Team Information

- **Product Owner**: `<mkuida>` - Roadmapping and user needs analysis.
- **Project Manager**: `<ishihar>` - Milestone management and Docker coordination.
- **Technical Lead**: `<kosakats>` - 3D rendering pipeline and piece physics.
- **Developer**: `<okaname>` - Core game rules and logic engine implementation.

---

## 👤 Individual Contributions & Challenges

- **`<okaname>`**: Challenged by NextAuth configuration with custom Prisma adapters. Resolved by implementing a custom session callback for JWT.
- **`<mkuida>`**: Faced race conditions in WebSocket room joining. Fixed using server-side locks and atomic state updates.
- **`<ishihar>`**: Optimizing 3D textures for web performance was a hurdle. Solved by using compressed GLB models and instance rendering.
- **`<kosakats>`**: Implementing "Naru" (Promotion) logic across the 3D-UI boundary. Solved by decoupling logic state from animation timers.

---

## 🤖 Resources & AI Usage

### AI Usage Policy
AI tools (specifically Cursor with the Antigravity agent) were utilized for:
- **Refactoring**: Cleaning up redundant logic in the Shogi engine.
- **Testing**: Generating edge-case mock data for logic validation.
- **Conflict Resolution**: Automating the resolution of build artifacts during merges.

### References
- [Next.js Documentation](https://nextjs.org/)
- [Prisma Reference](https://www.prisma.io/)
- [Socket.IO Documentation](https://socket.io/)
