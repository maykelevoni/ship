import { EmailConfig } from "next-auth/providers/email";

import { getUserByEmail } from "./user";
import { sendMagicLink } from "./brevo";

export const sendVerificationRequest: EmailConfig["sendVerificationRequest"] =
  async ({ identifier, url, provider: _provider }) => {
    const user = await getUserByEmail(identifier);
    const isNewUser = !user;
    const userVerified = user?.emailVerified ? true : false;
    const isNew = isNewUser || !userVerified;

    await sendMagicLink({
      to: identifier,
      url,
      name: user?.name ?? undefined,
      isNew,
    });
  };
