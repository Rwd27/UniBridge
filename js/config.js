/*
  UniBridge website settings
  --------------------------
  This is the only file you need to edit for marketing.
  Paste each ID between the quotes once the account is created, save, and upload this file again.
  Leave an ID empty ("") to switch that service off. Nothing loads until a visitor accepts cookies.
*/
window.UB_CONFIG = {
  siteUrl: "https://www.unibridge.ae",

  // Where enquiry forms are sent. contact.php emails them to info@unibridge.ae.
  formEndpoint: "contact.php",

  // Google Tag Manager container, e.g. "GTM-ABC1234".
  // Optional: if you use Tag Manager, you can manage every tag inside it and leave the IDs below empty.
  gtmId: "",

  // Google Analytics 4 measurement ID, e.g. "G-ABC123XYZ9" (visitor numbers, pages, sources)
  ga4Id: "G-H0WXJ6QE82",

  // Google Ads, e.g. "AW-123456789", plus the conversion label for an enquiry, e.g. "AbCdEfGhIj"
  googleAdsId: "",
  googleAdsLeadLabel: "",

  // Microsoft Clarity project ID (heatmaps and anonymous session recordings)
  clarityId: "z8ta03zm0k",

  // Meta Pixel (Facebook and Instagram ads), e.g. "123456789012345"
  metaPixelId: "",

  // LinkedIn Insight Tag partner ID, e.g. "1234567"
  linkedinPartnerId: "",

  // Social profiles: paste the full link. Icons appear in the footer only for links you fill in.
  social: {
    instagram: "https://www.instagram.com/unibridge.ae/",
    facebook: "https://www.facebook.com/profile.php?id=61596077607649",
    linkedin: "https://www.linkedin.com/company/145379468/",
    threads: "https://www.threads.com/@unibridge.ae",
    youtube: "",
    x: "",
    tiktok: ""
  }
};
