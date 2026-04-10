import { RamenHero } from '../components/RamenHero';
import { MenuScroll } from '../components/MenuScroll';
import { DeliveryWorkflow } from '../components/DeliveryWorkflow';
import { ChefSection } from '../components/ChefSection';
import { Testimonials } from '../components/Testimonials';

export function Home() {
  return (
    <>
      <RamenHero />
      <ChefSection />
      <MenuScroll />
      <Testimonials />
      <DeliveryWorkflow />
    </>
  );
}
