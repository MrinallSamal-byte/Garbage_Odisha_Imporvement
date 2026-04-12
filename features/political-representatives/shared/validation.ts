import { z } from "zod";

export const politicalByLocationSchema = z.object({
  latitude: z.coerce.number().min(17).max(23),
  longitude: z.coerce.number().min(81).max(88),
});
