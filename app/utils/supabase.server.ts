import { createServerClient } from "@supabase/auth-helpers-remix";
// import { environment } from "./environment";

export const createSupabaseServerClient = ({
  request
}: {
  request: Request;
}) => {
  const response = new Response();
  return createServerClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || "",
    {
      request,
      response
    }
  );
};
