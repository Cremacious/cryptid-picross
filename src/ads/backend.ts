// Default / web / test implementation: the no-op. Metro resolves this on web and Jest
// picks it up too, so neither ever loads the native `react-native-google-mobile-ads`
// module. Native platforms resolve `backend.native.ts` instead.
export { noopBackend as adsBackend } from './noopBackend';
