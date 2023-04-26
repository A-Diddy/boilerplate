
import paths from './paths.js';
export const paths:any = paths;

declare module 'paths' {
  const paths = paths;
  export {paths};
}
