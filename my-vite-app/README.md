# Study Group Client

A modern React + TypeScript + Vite application for the Study Group platform. Connect with fellow students, join study groups, and collaborate in real-time with integrated chat functionality.

## ✨ Features

### Authentication & User Management
- ✅ User registration and login with JWT authentication
- ✅ Profile management with skills and bio
- ✅ Persistent sessions with token refresh
- ✅ Protected routes with automatic redirects

### Study Groups
- ✅ Browse and discover study groups
- ✅ Create study groups for specific courses
- ✅ Join/leave groups dynamically
- ✅ View group members and member management
- ✅ Group filtering and search functionality

### Real-Time Chat
- ✅ Real-time messaging with SignalR
- ✅ Text messages, image uploads, and link sharing
- ✅ Message history and conversation threads
- ✅ Group chat for each study group
- ✅ Media gallery view (images and links)

### State Management
- ✅ Redux Toolkit with async thunks
- ✅ Centralized state for auth, groups, and messages
- ✅ Optimistic updates for better UX
- ✅ Automatic state synchronization

### UI/UX
- ✅ Material-UI components with custom theming
- ✅ Responsive design (mobile and desktop)
- ✅ Form validation with helpful error messages
- ✅ Loading states and error boundaries
- ✅ Smooth animations and transitions

## 🛠 Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Redux Toolkit** - Predictable state management
- **Material-UI (MUI) v5** - Component library
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **SignalR** - Real-time WebSocket communication
- **jwt-decode** - JWT token parsing

## 📁 Project Structure

```
src/
├── components/
│   ├── Chat.tsx                    # Real-time chat component
│   ├── CreateGroupDialog.tsx       # Group creation modal
│   ├── DiscoverGroups.tsx          # Browse study groups
│   ├── ErrorBoundary.tsx           # Error handling wrapper
│   ├── Profile.tsx                 # User profile editor
│   └── ProtectedRoute.tsx          # Route protection
├── config/
│   └── api.ts                      # Axios configuration & interceptors
├── pages/
│   ├── Dashboard.tsx               # Main dashboard with sidebar
│   ├── Discover.tsx                # Public discovery page
│   ├── Landing.tsx                 # Landing page
│   ├── Login.tsx                   # Login page
│   └── Register.tsx                # Registration page
├── services/
│   ├── chatService.ts              # SignalR chat service
│   ├── courseService.ts            # Course API service
│   ├── groupMemberService.ts       # Group membership service
│   ├── messageService.ts           # Message API service
│   ├── studyGroupService.ts        # Study group API service
│   └── userService.ts              # User API service
├── store/
│   ├── store.ts                    # Redux store configuration
│   ├── hooks.ts                    # Typed Redux hooks
│   └── slices/
│       ├── authSlice.ts            # Authentication state
│       ├── studyGroupsSlice.ts     # Study groups state
│       └── messagesSlice.ts        # Messages state
├── types/
│   ├── common.ts                   # Shared TypeScript types
│   └── message.ts                  # Message-related types
├── utils/
│   └── jwtUtils.ts                 # JWT token utilities
├── App.tsx                         # Main app with routes & theme
└── main.tsx                        # Entry point
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Backend API** running on `https://localhost:43960`

### Installation

1. Navigate to the project directory:
   ```bash
   cd "c:\Professional software dev\StudyGroup.Client\my-vite-app"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🔌 API Configuration

The API base URL is configured in `src/config/api.ts`:

```typescript
const API_BASE_URL = 'https://localhost:43960/api';
```

### API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

#### Users
- `GET /users/me` - Get current user profile
- `PUT /users/{id}` - Update user profile

#### Study Groups
- `GET /studygroups` - Get all study groups
- `POST /studygroups` - Create a study group
- `POST /studygroups/{id}/join` - Join a study group

#### Group Members
- `GET /groupmembers/user/{userId}` - Get user's groups
- `GET /groupmembers/groups/{groupId}/members` - Get group members
- `DELETE /groupmembers/{id}` - Leave group or remove member

#### Messages
- `GET /messages/conversation/{conversationId}` - Get conversation messages
- `POST /messages` - Send a message
- `POST /messages/group/{groupId}/conversation` - Get/create group conversation
- `PUT /messages/{id}/read` - Mark conversation as read

#### Courses
- `GET /courses` - Get all courses

#### File Upload
- `POST /fileupload/image` - Upload image file

## 🔐 Authentication Flow

1. **Registration**: User creates account with email, password, name
2. **Login**: User provides credentials to receive JWT token
3. **Token Storage**: JWT stored in localStorage and Redux state
4. **Auto-Refresh**: Profile data fetched on login and app load
5. **Protected Routes**: Automatic redirect to login if unauthenticated
6. **Token Interceptor**: Axios automatically adds token to requests
7. **Logout**: Token removed from storage and state cleared

## 🎯 Redux State Management

### Auth Slice
- User profile (name, email, skills, bio)
- Authentication status
- Login/register async thunks
- Profile update functionality

### Study Groups Slice
- My groups (user's memberships)
- All groups (for discovery)
- Selected group
- Create/join/leave group thunks

### Messages Slice
- Conversations by group ID
- Messages by conversation ID
- Send message thunk
- Real-time message updates via Redux actions

## 💬 Real-Time Chat with SignalR

The app uses SignalR for real-time messaging:

1. **Connection**: Established when entering a chat
2. **Join Group**: Automatically joins conversation on load
3. **Receive Messages**: Updates Redux state via `addMessage` action
4. **Send Messages**: Dispatches Redux thunk, then broadcasts via SignalR
5. **Optimistic Updates**: Messages appear immediately in UI

### SignalR Events
- `ReceiveMessage` - New message received
- `MessageEdited` - Message was edited
- `MessageDeleted` - Message was deleted
- `UserTyping` - User is typing (UI only, backend not implemented)

## ✅ Form Validation

### Registration
- **First/Last name**: Required, max 50 characters
- **Email**: Required, valid email format
- **Password**: Min 8 characters, must contain:
  - Uppercase letter
  - Lowercase letter
  - Number
- **Confirm Password**: Must match password
- **Skills**: Optional, max 1000 characters
- **Bio**: Optional, max 500 characters

### Login
- **Email**: Required, valid email format
- **Password**: Required

### Create Group
- **Course**: Required (select from dropdown)
- **Topic**: Required
- **Time Slot**: Optional
- **Description**: Optional

## 🎨 Theming

Custom Material-UI theme with gradient palette:
- **Primary**: `#667eea` (Purple-Blue)
- **Secondary**: `#764ba2` (Deep Purple)
- **Gradient**: Linear gradient from primary to secondary

## 🐛 Troubleshooting

### CORS Issues
Ensure backend API has CORS enabled for `http://localhost:5173`

### SSL Certificate Errors
Accept the self-signed certificate for `https://localhost:43960` in your browser

### Token Expiration
Tokens expire after 1 hour. The app automatically redirects to login on 401 errors.

### SignalR Connection Issues
- Check that backend SignalR hub is running
- Verify JWT token is valid
- Check browser console for connection errors

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📦 Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-redux": "^9.2.0",
  "@reduxjs/toolkit": "^2.5.0",
  "@mui/material": "^5.16.7",
  "react-router-dom": "^6.28.0",
  "@microsoft/signalr": "^8.0.7",
  "axios": "^1.7.7",
  "jwt-decode": "^4.0.0"
}
```

## 🚦 Application Routes

- `/` - Landing page (guest access)
- `/login` - Login page
- `/register` - Registration page
- `/discover` - Public group discovery (guest access)
- `/dashboard` - Main dashboard (protected)
  - Group chat view
  - Discover groups view
  - Profile view

## 🔒 Protected Routes

The `ProtectedRoute` component:
- Checks for valid JWT token
- Verifies token expiration
- Redirects to `/login` if unauthenticated
- Shows loading state during validation


## 👥 Author

Developed as part of a software development course project.

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- Redux Toolkit for simplified state management
- SignalR for real-time functionality
- Vite for blazing fast development experience
