import { RamenHero } from '../components/RamenHero';
import { MenuScroll } from '../components/MenuScroll';
import { DeliveryWorkflow } from '../components/DeliveryWorkflow';
import { ChefSection } from '../components/ChefSection';
import { Testimonials } from '../components/Testimonials';
import { CTAStrip } from '../components/CTAStrip';
import { FloatingCTA } from '../components/FloatingCTA';
import { SEOHead } from '../components/SEOHead';
import { useSettings } from '../hooks/useSettings';

const RESTAURANT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Sumi Sushi and Poke",
  "image": "https://sumisushiandpoke.fi/favicon.png",
  "url": "https://sumisushiandpoke.fi",
  "telephone": "+358442479393",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kuskinkatu 3",
    "addressLocality": "Kaarina",
    "postalCode": "20780",
    "addressCountry": "FI"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 60.4067,
    "longitude": 22.3674
  },
  "servesCuisine": ["Japanese", "Sushi", "Poke", "Ramen"],
  "priceRange": "€€",
  "acceptsReservations": "True",
  "menu": "https://sumisushiandpoke.fi/order",
  "hasMenu": {
    "@type": "Menu",
    "url": "https://sumisushiandpoke.fi/order"
  },
  "potentialAction": [
    {
      "@type": "OrderAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://sumisushiandpoke.fi/order",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
      },
      "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModePickUp", "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"]
    },
    {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://sumisushiandpoke.fi/reservations",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
      }
    }
  ]
};

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://sumisushiandpoke.fi/"
    }
  ]
};

export function Home() {
  const { settings } = useSettings();

  // Build dynamic opening hours from settings
  const dynamicRestaurantSchema = {
    ...RESTAURANT_SCHEMA,
    telephone: settings.contactPhone || RESTAURANT_SCHEMA.telephone,
  };

  return (
    <>
      <SEOHead
        title="Sumi Sushi & Poke | Authentic Japanese Restaurant in Kaarina, Finland"
        description="Discover authentic Japanese sushi, poke bowls, ramen & wok dishes at Sumi Sushi and Poke in Kaarina, Finland. Order online for delivery or reserve a table today."
        canonicalPath="/"
        ogType="restaurant"
        structuredData={[dynamicRestaurantSchema, BREADCRUMB_SCHEMA]}
      />
      <RamenHero />
      {/* <ChefSection /> */}
      <MenuScroll />
      <Testimonials />
      <DeliveryWorkflow />
      <CTAStrip />
      <FloatingCTA />
    </>
  );
}
