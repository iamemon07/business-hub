import { collectionHandlers } from "@/lib/crud";
import { resources } from "@/lib/resources";

export const { GET, POST } = collectionHandlers(resources.pages);
