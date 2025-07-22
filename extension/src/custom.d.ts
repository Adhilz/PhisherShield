// extension/src/custom.d.ts

// This declaration tells TypeScript that any file ending with '.css'
// should be treated as a module that exports a default string.
// This string will be the content of the CSS file after being processed by css-loader.
declare module '*.css' {
  const content: string;
  export default content;
}