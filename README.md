*This project has been created as part of the 42 curriculum by okaname, mkuida, tishihar, kosakats.*

# 5x5 Mini Shogi Online

<img width="1907" height="931" alt="image" src="https://github.com/user-attachments/assets/304077c1-b08c-4eba-88c0-8b9b4a6c5e05" />


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
- **TOS & Privacy Policy**: `<tishihar>` - Implementation of Terms of Service and Privacy Policy.
- **Chat**: `<kosakats>` / `<tishihar>` - Implementation of chat system.
- **remote players**: `<okaname>` - Implementation of remote players.

---

## 🧩 Modules & Point Calculation (all 21 points)

| Points | Section | Type | Module | Assignee |
|---|---|---|---|---|
| 🟢 | 1.Web | Major | **Use a framework for both the frontend and backend** | All |
| 🟢 | 1.Web | Major | **Implement real-time features using WebSockets or similar technology** | `<okaname>` / `<mkuida>` |
| 🟢 | 1.Web | Major | **Allow users to interact with other users** | `<mkuida>` / `<tishihar>` |
| 🟡 | 1.Web | Minor | **Use an ORM for the database** | `<mkuida>` |
| 🟡 | 1.Web | Minor | **Server-Side Rendering (SSR) for improved performance and SEO** | All |
| 🟡 | 2.Accessibility and Internationalization | Minor | **Support for additional browsers** | All |
| 🟢 | 3.User Management | Major | **Standard user management and authentication** | `<mkuida>` |
| 🟡 | 3.User Management | Major | **Implement remote authentication with OAuth 2.0** | `<mkuida>` |
| 🟢 | 4.Artificial Intelligence | Major | **Introduce an AI Opponent for games** | `<okaname>` |
| 🟢 | 6.Gaming and user experience | Major | **Implement a complete web-based game where users can play against each other** | All |
| 🟢 | 6.Gaming and user experience | Major | **Remote players** | `<okaname>` |
| 🟢 | 6.Gaming and user experience | Major | **Implement advanced 3D graphics** | `<kosakats>` |
| 🟡 | 6.Gaming and user experience | Minor | **Implement spectator mode for games** | `<okaname>` / `<kosakats>` |

> 🟢 = 2 points &nbsp;&nbsp; 🟡 = 1 point

### Module Descriptions

#### 1.Web
- **Use a framework for both the frontend and backend (Major)**: Next.js was chosen as our full-stack framework, utilizing its App Router for robust frontend rendering and built-in API routes for backend endpoints.
- **Implement real-time features using WebSockets (Major)**: Integrated Socket.IO to enable bidirectional communication for instant match status updates, chat payloads, and player presence.
- **Allow users to interact with other users (Major)**: Implemented a comprehensive social ecosystem where users can manage their profiles, send friend requests, and communicate via a built-in real-time chat system.
- **Use an ORM for the database (Minor)**: Integrated Prisma ORM to efficiently map our PostgreSQL database to application state, providing robust typing and preventing SQL injection attacks.
- **Server-Side Rendering (SSR) for improved performance and SEO**: use next.js

#### 2.Accessibility and Internationalization
- **Support for additional browsers (Minor)**: Extensively tested UI components and WebSocket functionality to ensure full compatibility with Mozilla Firefox, not just Chromium browsers.

#### 3.User Management
- **Standard user management and authentication (Major)**: Maintained secure user signup/login flows utilizing salted password hashing, allowing users to safely manage their own profiles.
- **Implement remote authentication with OAuth 2.0 (Major)**: Provided a seamless login experience using OAuth, allowing users to securely authenticate via third-party providers.

#### 4.Artificial Intelligence
- **AI Opponent (Major)**: Developed a move-search logic algorithm for single-player mode, allowing users to practice against an automated opponent offline.

#### 6.Gaming and user experience
- **Implement a complete web-based game (Major)**: Engineered a complete 5x5 Mini Shogi game engine implementing move validation, piece promotion ("Naru"), and captured pieces system.
- **Remote players (Major)**: Realized through our WebSockets integration, ensuring low-latency, real-time board state synchronization between players on different networks.
- **Advanced 3D Graphics (Major)**: Leveraged React Three Fiber (Three.js) and Blender-designed models to build an immersive 3D view of the Shogi board, with custom pieces and animations.
- **Implement spectator mode for games (Minor)**: Allows non-playing viewers to join active match rooms to watch games in real-time, receiving the same live board updates and having access to real-time chat.

---

## 👥 Team Information

- **Product Owner (PO)**: `<mkuida>` - Roadmapping, user needs analysis, and overseeing the social/auth module logic to ensure product viability.
- **Project Manager (PM)**: `<tishihar>` - Task tracking, milestone management, Docker coordination, and enforcing code reviews.
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
- **`<tishihar>`**: Optimizing 3D textures for web performance was a hurdle. Solved by using compressed GLB models and instance rendering.
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
