# Features Directory Structure

Each feature folder should follow this pattern for scalability:

```text
feature-name/
├── components/      # Feature-specific UI components
├── hooks/           # Feature-specific hooks
├── services/        # API calls related to this feature
├── types/           # Type definitions for this feature
├── utils/           # Helper functions for this feature
└── index.ts         # Public API for the feature (exports what's needed)
```

Example: `src/features/auth/`
- `components/LoginForm.tsx`
- `hooks/useLogin.ts`
- `services/authService.ts`
- `types/authTypes.ts`
