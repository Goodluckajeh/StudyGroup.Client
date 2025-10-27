# Study Group Client

A React + TypeScript + Vite application for the Study Group platform, using Redux Toolkit for state management and Material UI for components.

## Features

- ✅ User Authentication (Login/Register)
- ✅ Redux Toolkit for state management
- ✅ Material UI components
- ✅ Form validation
- ✅ Protected routes
- ✅ JWT token management
- ✅ Axios API integration

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **Material UI (MUI)** - Component library
- **React Router v6** - Routing
- **Axios** - HTTP client

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.tsx    # Route protection component
├── config/
│   └── api.ts                 # Axios configuration
├── pages/
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Register page
│   └── Dashboard.tsx          # Dashboard (protected)
├── store/
│   ├── store.ts               # Redux store configuration
│   ├── hooks.ts               # Typed Redux hooks
│   └── slices/
│       └── authSlice.ts       # Authentication slice
├── App.tsx                    # Main app component
└── main.tsx                   # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `https://localhost:43960`

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

## API Configuration

The API base URL is configured in `src/config/api.ts`:

```typescript
const API_BASE_URL = 'https://localhost:43960/api';
```

### API Endpoints Used

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Authentication Flow

1. **Registration**: User fills out the registration form with required fields
2. **Login**: User provides email and password to receive JWT token
3. **Token Storage**: JWT token is stored in localStorage
4. **Protected Routes**: Routes check for valid token before rendering
5. **Logout**: Token is removed from localStorage

## Form Validation

### Registration
- First/Last name: Required, max 50 characters
- Email: Required, valid email format
- Password: Min 8 characters, must contain uppercase, lowercase, and number
- Confirm Password: Must match password
- Skills: Optional, max 1000 characters
- Bio: Optional, max 500 characters

### Login
- Email: Required, valid email format
- Password: Required

## Troubleshooting

### CORS Issues
Make sure your backend API has CORS enabled for the frontend URL.

### SSL Certificate Errors
If using localhost with HTTPS, you may need to accept the certificate in your browser.

### Token Expiration
Tokens expire after 1 hour. The app will automatically redirect to login on 401 errors.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
