// Inject schema markup after page load
(function(){
  const schema = {
    "@context": "https://schema.org",
    "@type": "MobilePhoneStore",
    "additionalType": ["MobileService", "OnSiteService"],
    "@id": "https://gadgetfixllc.com/#business",
    "name": "GadgetFix LLC",
    "alternateName": "GadgetFix",
    "description": "Mobile phone repair service covering Dallas-Fort Worth. We come to you! Same-day iPhone screen repair from $79. Samsung, iPad & computer fix at your location.",
    "image": "https://gadgetfixllc.com/images/gadgetfix-logo.svg",
    "logo": "https://gadgetfixllc.com/images/gadgetfix-logo.svg",
    "telephone": "+1-402-416-6942",
    "url": "https://gadgetfixllc.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dallas",
      "addressRegion": "TX",
      "postalCode": "75001",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.7767,
      "longitude": -96.7970
    },
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "18:00"
    }],
    "priceRange": "$",
    "providesMobilityService": true,
    "serviceType": "Mobile device repair at your location",
    "areaServed": [
      {"@type": "City", "name": "Dallas"},
      {"@type": "City", "name": "Fort Worth"},
      {"@type": "City", "name": "Plano"},
      {"@type": "City", "name": "Frisco"},
      {"@type": "City", "name": "Irving"},
      {"@type": "City", "name": "Arlington"}
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Phone Repair Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "iPhone Screen Repair",
            "description": "Same-day iPhone screen replacement for all models"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Samsung Galaxy Repair",
            "description": "Expert Samsung phone repair services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Battery Replacement",
            "description": "Professional battery replacement with warranty"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Damage Recovery",
            "description": "Expert water damage recovery and restoration"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "312",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Sarah M."
        },
        "datePublished": "2024-01-15",
        "reviewBody": "Amazing service! My iPhone 14 screen was cracked badly and they came to my office in Plano within 30 minutes. Fixed it perfectly and the warranty gave me peace of mind. Highly recommend!"
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Mike Rodriguez"
        },
        "datePublished": "2024-01-08",
        "reviewBody": "Fast and professional Samsung Galaxy repair in Fort Worth. Water damage recovery saved my phone with all my photos. The technician was knowledgeable and explained everything clearly."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Jennifer Chen"
        },
        "datePublished": "2024-01-03",
        "reviewBody": "Excellent mobile repair service! They came to my home in Dallas and fixed my iPad screen in 45 minutes. Fair pricing and quality work. Will definitely use again."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "4",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "David Park"
        },
        "datePublished": "2023-12-28",
        "reviewBody": "Good service overall. iPhone battery replacement was done quickly and works great. Only minor issue was arrival time was 45 minutes instead of 30, but the quality made up for it."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Lisa Thompson"
        },
        "datePublished": "2023-12-20",
        "reviewBody": "Outstanding emergency repair service! My phone broke right before an important work presentation. They arrived in 20 minutes to my Irving office and had it fixed in time. Lifesavers!"
      }
    ]
  };
  
  // Inject schema after 2 seconds
  setTimeout(function() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }, 2000);
})();