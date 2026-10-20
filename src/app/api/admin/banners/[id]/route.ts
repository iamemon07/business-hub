import { itemHandlers } from "@/lib/crud";
import { resources } from "@/lib/resources";

export const { GET, PUT, DELETE } = itemHandlers(resources.banners);
