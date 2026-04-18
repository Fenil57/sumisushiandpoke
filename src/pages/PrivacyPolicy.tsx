import React from "react";
import { LegalPageLayout } from "../components/LegalPageLayout";

const sections = [
  {
    title: "What We Collect",
    paragraphs: [
      "We collect the information you submit when you place an order, request a reservation, contact the restaurant, or sign in to the admin dashboard. This can include your name, phone number, email address, delivery address, reservation details, and the items you order.",
      "We also store operational data connected to your request, such as order totals, delivery fees, reservation status, and timestamps needed to run the restaurant service.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: [
      "We use your information to prepare and deliver orders, manage reservations, contact you about your request, send restaurant notifications, and operate the admin dashboard.",
      "If email notifications are enabled, order and reservation details may be sent to the restaurant's notification inbox and confirmation emails may be sent to customers.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "At the moment, this website can operate in a manual order mode where payment is not collected online. If online payments are enabled later, payment processing will be handled by a separate payment provider and card details will not be stored in this website database.",
    ],
  },
  {
    title: "Storage and Service Providers",
    paragraphs: [
      "Operational data is stored using Firebase services for database and authentication. The website may also rely on email delivery providers and hosting providers to send notifications and keep the service available.",
      "We only share data with service providers when it is necessary to run the website, process customer requests, secure the service, or deliver operational emails.",
    ],
  },
  {
    title: "How Long We Keep Data",
    paragraphs: [
      "We keep order, reservation, and admin-access records for as long as needed to operate the restaurant, respond to customer questions, maintain records, and protect the business from fraud or abuse.",
      "We may delete or anonymize information when it is no longer needed for those purposes.",
    ],
  },
  {
    title: "Your Rights",
    paragraphs: [
      "Depending on the laws that apply to you, you may have the right to request access to the personal information we hold about you, ask us to correct inaccurate information, or request deletion when we no longer need the data.",
      "To make a privacy-related request, contact the restaurant using the details shown below.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use access controls, authentication, and provider-level security tools to help protect the information processed through this website. No internet-based system can be guaranteed completely secure, but we aim to limit access to authorized staff and required service providers only.",
    ],
  },
  {
    title: "Updates to This Policy",
    paragraphs: [
      "We may update this Privacy Policy when the service, data flows, or legal requirements change. The latest version will always be published on this page with the updated date.",
    ],
  },
];

export function PrivacyPolicy() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      updatedAt="April 17, 2026"
      intro="This Privacy Policy explains how Sumi Sushi and Poke collects, uses, stores, and shares information when you use this website for restaurant orders, reservations, contact, or admin access."
      sections={sections}
    />
  );
}
