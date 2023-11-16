import { createServerClient } from "@supabase/auth-helpers-remix";
import { environment } from "./environment";

export const createSupabaseServerClient = ({
  request
}: {
  request: Request;
}) => {
  const response = new Response();

  return createServerClient(
    environment.SUPABASE_URL || "",
    environment.SUPABASE_ANON_KEY || "",
    {
      request,
      response
    }
  );
};
