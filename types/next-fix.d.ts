declare module 'next/navigation' {
  import { AppRouterInstance, ReadonlyURLSearchParams } from 'next/dist/shared/lib/app-router-context.shared-runtime';
  export function useRouter(): AppRouterInstance;
  export function usePathname(): string;
  export function useSearchParams(): ReadonlyURLSearchParams;
  export function useParams<T = any>(): T;
  export function useSelectedLayoutSegment(parallelRouteKey?: string): string | null;
  export function useSelectedLayoutSegments(parallelRouteKey?: string): string[];
  export const redirect: (url: string) => never;
  export const permanentRedirect: (url: string) => never;
  export const notFound: () => never;
}
