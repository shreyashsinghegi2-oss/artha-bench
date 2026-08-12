// Vercel compiles this TypeScript entrypoint and its imports to JavaScript.
// Referencing the emitted extension prevents a production-only `server.ts`
// module-not-found crash inside the Node.js function runtime.
import app from '../server.js';

export default app;
