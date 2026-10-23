import { redirect } from "next/navigation";

// Unknown or old links land on the Wall.
export default function NotFound() {
  redirect("/");
}
