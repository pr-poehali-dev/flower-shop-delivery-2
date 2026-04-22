import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import BouquetConstructor from "@/components/BouquetConstructor";
import InfoSections from "@/components/InfoSections";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar scrollTo={scrollTo} />
      <HeroSection scrollTo={scrollTo} />
      <BouquetConstructor />
      <InfoSections scrollTo={scrollTo} />
    </div>
  );
}
