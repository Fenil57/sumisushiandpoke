import React from "react";
import { LegalPageLayout } from "../components/LegalPageLayout";

const sections = [
  {
    title: "Using This Website",
    paragraphs: [
      "This website is provided to help customers browse the restaurant menu, place food orders, request reservations, and contact Sumi Sushi and Poke. By using the website, you agree to use it lawfully and to provide accurate information.",
      "You must not misuse the website, interfere with its operation, attempt unauthorized access, or submit false, abusive, or fraudulent requests.",
    ],
  },
  {
    title: "Menu, Availability, and Pricing",
    paragraphs: [
      "We aim to keep menu items, pricing, opening hours, and availability up to date, but they may change without notice. Items may become unavailable after you begin an order, and obvious mistakes in descriptions or prices may need to be corrected before fulfillment.",
      "Displayed delivery fees, order totals, and service availability may depend on your address, order size, and current restaurant settings.",
    ],
  },
  {
    title: "Orders",
    paragraphs: [
      "When you place an order, you must provide valid contact details and, for delivery orders, a valid delivery address. We may reject or cancel an order if the information is incomplete, the order cannot be fulfilled, or the request appears abusive or fraudulent.",
      "While online payment is postponed, the website may place orders in an unpaid manual mode. In that case, submitting the order sends it to the restaurant for handling but does not mean payment has been collected online.",
    ],
  },
  {
    title: "Reservations",
    paragraphs: [
      "Reservation requests are subject to confirmation by the restaurant. Sending a reservation request through the website does not guarantee table availability until the restaurant accepts it.",
      "Most reservation requests can be updated or cancelled through the secure manage link sent after booking. Online changes may close shortly before the reservation time, and self-service may be unavailable for some requests.",
      "If the manage link is unavailable, invalid, or the reservation is too close, contact the restaurant directly as soon as possible.",
    ],
  },
  {
    title: "Communication",
    paragraphs: [
      "By submitting an order or reservation request, you agree that the restaurant may contact you about that request by phone or email when needed for confirmation, fulfillment, updates, or issue resolution.",
    ],
  },
  {
    title: "Third-Party Services",
    paragraphs: [
      "This website may rely on third-party providers for hosting, database services, authentication, email delivery, maps or address validation, and future payment processing. Those services operate under their own terms and privacy practices.",
    ],
  },
  {
    title: "Liability",
    paragraphs: [
      "We aim to keep the website accurate and available, but we do not guarantee uninterrupted service or that the website will always be error-free. To the maximum extent allowed by law, the restaurant is not liable for indirect or consequential losses arising from use of the website.",
      "Nothing in these Terms limits rights that cannot legally be excluded under applicable consumer law.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update these Terms when the service changes, including when online payments are enabled later. The latest version will be posted on this page with the updated date.",
    ],
  },
];

export function TermsOfService() {
  return (
    <LegalPageLayout
      eyebrow="Terms"
      title="Terms of Service"
      updatedAt="April 18, 2026"
      intro="These Terms of Service govern the use of the Sumi Sushi and Poke website, including menu browsing, reservation requests, contact forms, and online ordering features."
      sections={sections}
    />
  );
}
