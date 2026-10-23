import Wall from "@/src/components/Wall";
import { publicState } from "@/lib/wall";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Wall initial={publicState()} />;
}
