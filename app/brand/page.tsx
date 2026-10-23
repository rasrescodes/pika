import Header from "@/src/components/Header";
import BrandForm from "@/src/components/BrandForm";
import { PRESETS } from "@/lib/brands";
import { currentBrand } from "@/lib/wall";
import { mockSection } from "@/lib/mockGenerator";
import { sanitise } from "@/lib/sanitise";

export const dynamic = "force-dynamic";

export default function BrandPage() {
  return (
    <>
      <Header current="brand" />
      <BrandForm presets={PRESETS} current={currentBrand()} previews={Object.fromEntries(PRESETS.map((p) => [p.id, sanitise(mockSection(p, "split"))]))} />
    </>
  );
}
