import { redirect } from "next/navigation";

// Unknown or old links land on the Wall (307), in development and production alike.
export default function Unknown() {
  redirect("/");
}
