# AGENTS.md

This file provides essential information for agentic coding agents working in this repository.

## Build Commands

```bash
# Development
npm run dev              # Start Vite dev server (without Tauri)
npm run tauri:dev       # Start Tauri development mode (includes Rust backend)

# Building
npm run build            # Build frontend: tsc + vite build
npm run tauri:build      # Build Tauri app for production (platform-specific binaries)

# Preview
npm run preview          # Preview production build in browser
npm run tauri -- [cmd]   # Run Tauri CLI commands directly

# TypeScript
npx tsc --noEmit         # Type-check without emitting files

# Build for release 
npm run tauri:build -- --target aarch64-unknown-linux-gnu
```

## Testing

No test framework is currently configured. To add testing:

- Install test dependencies (e.g., `npm install -D vitest @testing-library/react @testing-library/jest-dom`)
- Create test files with `.test.ts` or `.spec.ts` suffix
- Add test scripts to package.json (e.g., `"test": "vitest"`, `"test:ui": "vitest --ui"`)

## Code Style Guidelines

### TypeScript Configuration

Strict mode is enforced via `tsconfig.json`:
- `strict: true` - Full type checking
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused parameters
- `noFallthroughCasesInSwitch: true` - Exhaustive switch cases

### Imports

```typescript
// React hooks - named imports
import { useState, useEffect } from "react";

// Local files - use relative paths from frontend/
import { greet } from "./api/tauri";
import App from "./App";

// Tauri APIs
import { invoke } from "@tauri-apps/api/tauri";
```

**Important:** Do not import `React` directly - JSX Transform (React 17+) handles this automatically.

### React Components

```typescript
// Functional components only - no class components
function MyComponent({ prop }: { prop: string }) {
  const [value, setValue] = useState<string>("");
  const handleClick = async () => {
    try {
      const result = await someApiCall();
      setValue(result);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return <div className="p-4">{value}</div>;
}
export default MyComponent;
```

### Tauri Commands

**Rust backend (`src-tauri/src/lib.rs`):**
```rust
#[tauri::command]
fn my_command(name: &str) -> String {
    format!("Hello, {name}!")
}
```

**TypeScript wrapper (`frontend/api/tauri.ts`):**
```typescript
import { invoke } from "@tauri-apps/api/tauri";

export async function myCommand(name: string): Promise<string> {
  return await invoke("my_command", { name });
}
```

### Naming Conventions

- **Components:** PascalCase (`App.tsx`, `UserProfile.tsx`)
- **Functions/Variables:** camelCase (`handleClick`, `userName`)
- **Types/Interfaces:** PascalCase (`UserData`, `ApiResponse`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **File/Directory:** kebab-case folders, PascalCase components

### File Structure

```
frontend/
├── api/           # Tauri API wrappers (tauri.ts)
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── types/         # TypeScript definitions (index.ts, env.d.ts)
├── utils/         # Utility functions
├── App.tsx        # Main app component
└── index.tsx      # React entry point

src-tauri/src/
├── main.rs        # Application entry point
└── lib.rs         # Tauri commands and backend logic
```

### Styling (TailwindCSS)

- Use utility classes directly in JSX
- Custom colors defined in `tailwind.config.js` (e.g., `primary-500`)
- Content pattern: `./frontend/**/*.{js,ts,jsx,tsx}`

```jsx
<div className="bg-primary-600 hover:bg-primary-700 text-white p-4">
  Content
</div>
```

### TypeScript Types

```typescript
// Primitives: string, number, boolean, null, undefined
const name: string = "value";

// Arrays
const items: string[] = ["a", "b"];

// Objects/Interfaces
interface User {
  id: string;
  name: string;
  email?: string;  // Optional
}

// Union types
type Status = "loading" | "success" | "error";

// Async functions return Promise<T>
async function fetchData(): Promise<User> {
  return { id: "1", name: "Test" };
}
```

### Module Aliases

Defined in `vite.config.ts`:
- `@` → `./frontend/`
- `@components` → `./frontend/components/`
- `@utils` → `./frontend/utils/`
- `@types` → `./frontend/types/`

Use: `import Button from "@components/Button";`

## Additional Notes

- **No ESLint/Prettier configured:** Add if desired for automated linting/formatting
- **No test framework:** Add Vitest or similar for testing
- **Tauri v1.8:** Check [Tauri v1 docs](https://tauri.app/v1/guides/) for API reference
- **Build artifacts:** Production builds go to `src-tauri/target/release/bundle/`
- **Dev server port:** 1420 (hardcoded in vite.config.ts)
