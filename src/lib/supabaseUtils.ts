import { supabase } from "@/integrations/supabase/client";
import { getSessionToken } from "@/lib/authSession";

let lastSessionToken: string | null = null;
let contextPromise: Promise<void> | null = null;

export const resetUserContextCache = () => {
  lastSessionToken = null;
  contextPromise = null;
};

export const withUserContext = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  const sessionToken = getSessionToken();

  if (sessionToken) {
    if (contextPromise) {
      await contextPromise;
    }

    const shouldRestore = lastSessionToken !== sessionToken;

    contextPromise = (async () => {
      try {
        const { data, error } = await supabase.rpc("restore_user_session", {
          p_session_token: sessionToken,
        });

        if (error || data !== true) {
          console.error("Could not restore user session for RLS:", error);
          throw error ?? new Error("Invalid session");
        }

        lastSessionToken = sessionToken;

        if (shouldRestore && process.env.NODE_ENV === "development") {
          console.log("Session context restored for operation");
        }
      } finally {
        contextPromise = null;
      }
    })();

    await contextPromise;
  }

  return await operation();
};
