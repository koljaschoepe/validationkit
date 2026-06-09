import { redirect } from "next/navigation";

// Bundle F: English-friendly alias for the (authoritative German)
// Datenschutzerklärung.
export default function PrivacyAlias() {
  redirect("/legal/datenschutz" as never);
}
