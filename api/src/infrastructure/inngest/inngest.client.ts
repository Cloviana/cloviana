import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "cloviana-api",
  appVersion: process.env.INNGEST_APP_VERSION,
});
