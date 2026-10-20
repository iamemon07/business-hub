import { themeCss } from "@/lib/theme";
import type { ThemeDTO } from "@/types";

/** Injects a business's brand palette as CSS variables (server-rendered, no flash). */
export function ThemeStyle({ theme }: { theme?: Partial<ThemeDTO> }) {
  return <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />;
}
