import * as z from "zod";

const environmentSchema = z.object({
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string()
});

const environment = environmentSchema.parse(process.env);

export { environment };
