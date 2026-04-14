# 5x5 Mini Shogi Online

*This project has been created as part of the 42 curriculum by okaname, mkuida, tishihar, kosakats.*

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
- **Real-time Synchronization**: `<okaname>` / `<tishihar>` - WebSocket server handling room management and move broadcasting.
- **User Management & Auth**: `<mkuida>` - Signup/Login flow, profile editing, and friend request system.
- **Spectator UI**: `<okaname>` / `<kosakats>` - Global state management for non-playing viewers.
- **AI Opponent**: `<okaname>` - Move-search algorithm for offline play.
- **HTTPS**: `<tishihar>` - Implementation of secure HTTPS communication.
- **OAuth**: `<mkuida>` - Implementation of OAuth authentication.
- **TOS & Privacy Policy**: `<ishihar>` - Implementation of Terms of Service and Privacy Policy.
- **Chat**: `<kosakats>` / `<tishihar>` - Implementation of chat system.
- **remote players**: `<mkuida>` - Implementation of remote players.

---

## 🧩 Modules & Point Calculation(all 20 points)

| Module | Type | Assignee | Points |
|---|---|---|---|
| **Use a framework for both the frontend and backend** | Major | All | 2 |
| **Implement real-time features using WebSockets or similar technology** | Major | `<okaname>` / `<mkuida>` | 2 |
| **Allow users to interact with other users** | Major | `<mkuida>` / `<tishihar>` | 2 |
| **Use an ORM for the database** | Minor | `<mkuida>` | 1 |
| **Support for additional browsers** | Minor | All | 1 |
| **Standard user management and authentication** | Major | `<mkuida>` | 2 |
| **Implement remote authentication with OAuth 2.0** | Major | `<mkuida>` | 1 |
| **AI Opponent** | Major | `<okaname>` | 2 |
| **Implement a complete web-based game where users can play against each other** | Major | All | 2 |
| **Remote players** | Major | `<mkuida>` | 2 |
| **Advanced 3D Graphics** | Major | `<kosakats>` | 2 |
| **Implement spectator mode for games** | Minor | `<okaname>` / `<kosakats>` | 1 |


### Module Descriptions(Partially)

- **Use an ORM for the database (Minor)**: Integrated Prisma ORM to efficiently and securely map our PostgreSQL database to application state, providing robust typing and preventing SQL injection attacks.
- **Allow users to interact with other users (Major)**: Implemented a comprehensive social ecosystem where users can manage their profiles, send friend requests, and communicate via a built-in real-time chat system.
- **Implement spectator mode for games (Minor)**: Allows non-playing viewers to join active match rooms to watch games in real-time, receiving the same live board updates and having access to real-time chat.
- **Remote players — two players on separate computers (Major)**: Realized through our WebSockets integration, ensuring low-latency, real-time board state synchronization between players on different networks.
- **Game statistics and match history (Minor)**: Saves complete match data to the database, allowing users to view their past 1v1 game results, win/loss records, and current standings.

---

## 🔍 Reviewer Verification Checklist (Extra Modules)(all 4 points)

The following modules should be specifically verified by reviewers to ensure they meet the requirements during evaluation:

- **26. Game customization options (Minor)**: Players have options to customize their game experience. Please verify these settings function correctly.
- **Real-time collaborative features (Minor)**: Advanced live synchronization beyond simple gameplay, making the interface dynamically update based on concurrent user interactions.
- **Server-Side Rendering (SSR) (Minor)**: Pre-renders key application pages on the server utilizing Next.js, significantly boosting load performance and SEO capabilities. Check page sources to verify server-rendered HTML.
- **Game statistics and match history**: Saves complete match data to the database, allowing users to view their past 1v1 game results, win/loss records, and current standings.

---

## 👥 Team Information

- **Product Owner (PO)**: `<mkuida>` - Roadmapping, user needs analysis, and overseeing the social/auth module logic to ensure product viability.
- **Project Manager (PM)**: `<ishihar>` - Task tracking, milestone management, Docker coordination, and enforcing code reviews.
- **Technical Lead**: `<kosakats>` - Setting architectural guidelines, establishing the Next.js foundation, and directing the 3D rendering pipeline and piece physics.
- **Developer**: `<okaname>` - Core game rules, matchmaking, WebSocket connections, and logic engine implementation.

### Project Management Practices

- **Work Organization**: The team utilized a modular feature-branch workflow. Tasks were divided logically between frontend (3D/Next.js UI) and backend (WebSockets/Auth) groups, ensuring minimal merge conflicts and concurrent progress. Bi-weekly syncs were held to review milestones.
- **Tools Used**: We maintained our backlog, assigned issues, reviewed code pull-requests, and tracked sprint goals using **GitHub Issues** and an integrated Kanban board on GitHub Projects.
- **Communication Channel**: We utilized **Discord** as our primary communication channel for daily syncs, real-time pair programming, and prompt resolution of blocking issues.

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
- **initialize**: make initial app.
- **Refactoring**: Cleaning up redundant logic in the Shogi engine.
- **Testing**: Generating edge-case mock data for logic validation.
- **Conflict Resolution**: Automating the resolution of build artifacts during merges.

### References
- [Next.js Documentation](https://nextjs.org/)
- [Prisma Reference](https://www.prisma.io/)
- [Socket.IO Documentation](https://socket.io/)
