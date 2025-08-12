import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_BEFgHyqX.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_d87RFhlu.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const countyName = "Tarrant County";
  const cities = ["Fort Worth", "Arlington", "Grand Prairie", "Euless", "Bedford", "Hurst", "Grapevine", "Southlake", "Colleyville", "Keller", "North Richland Hills", "Mansfield", "Richland Hills", "Haltom City", "Watauga", "White Settlement", "Benbrook", "Burleson", "Crowley"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Phone Repair ${countyName} TX | All Cities | GadgetFix`, "description": `Mobile phone repair service throughout ${countyName}. We serve all cities with same-day service. Call (402) 416-6942`, "data-astro-cid-6wua65hz": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main data-astro-cid-6wua65hz> <!-- Hero Section - SAME AS HOMEPAGE --> <section class="hero" data-astro-cid-6wua65hz> <div class="container" data-astro-cid-6wua65hz> <div class="hero-content" data-astro-cid-6wua65hz> <h1 class="hero-title" data-astro-cid-6wua65hz>${countyName} Phone Repair</h1> <p class="hero-subtitle" data-astro-cid-6wua65hz>Select Your City for Mobile Device Repair Service</p> <div class="hero-cta" data-astro-cid-6wua65hz> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-6wua65hz>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> <!-- Cities Grid - CLEAN LIKE HOMEPAGE SERVICES --> <section class="cities-section" data-astro-cid-6wua65hz> <div class="container" data-astro-cid-6wua65hz> <h2 class="section-title" data-astro-cid-6wua65hz>Select Your City in ${countyName}</h2> <div class="cities-grid" data-astro-cid-6wua65hz> ${cities.map((city) => renderTemplate`<a${addAttribute(`/locations/tarrant-county/${city.toLowerCase().replace(" ", "-")}`, "href")} class="city-card" data-astro-cid-6wua65hz> <h3 data-astro-cid-6wua65hz>${city}</h3> <p data-astro-cid-6wua65hz>Mobile repair service</p> </a>`)} </div> </div> </section> <!-- Service Info - CLEAN PROFESSIONAL --> <section class="info-section" data-astro-cid-6wua65hz> <div class="container" data-astro-cid-6wua65hz> <h2 class="section-title" data-astro-cid-6wua65hz>Mobile Service Throughout ${countyName}</h2> <p data-astro-cid-6wua65hz>GadgetFix provides professional device repair across all of ${countyName}. Our mobile technicians come directly to your location for convenient, fast service. All repairs backed by our 90-day warranty.</p> <div class="service-features" data-astro-cid-6wua65hz> <div class="feature" data-astro-cid-6wua65hz> <h3 data-astro-cid-6wua65hz>Same Day Service</h3> <p data-astro-cid-6wua65hz>Fast response throughout ${countyName}</p> </div> <div class="feature" data-astro-cid-6wua65hz> <h3 data-astro-cid-6wua65hz>We Come to You</h3> <p data-astro-cid-6wua65hz>Mobile service at your location</p> </div> <div class="feature" data-astro-cid-6wua65hz> <h3 data-astro-cid-6wua65hz>90-Day Warranty</h3> <p data-astro-cid-6wua65hz>All repairs guaranteed</p> </div> </div> </div> </section> <!-- CTA Section - SAME AS HOMEPAGE --> <section class="final-cta" data-astro-cid-6wua65hz> <div class="container" data-astro-cid-6wua65hz> <div class="cta-content" data-astro-cid-6wua65hz> <h2 data-astro-cid-6wua65hz>READY FOR DEVICE REPAIR?</h2> <p data-astro-cid-6wua65hz>Professional mobile service throughout ${countyName}</p> <div class="cta-buttons" data-astro-cid-6wua65hz> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-6wua65hz>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> </main> ` })} `;
}, "C:/Users/gadge/GadgetFix-Website/src/pages/locations/tarrant-county/index.astro", void 0);

const $$file = "C:/Users/gadge/GadgetFix-Website/src/pages/locations/tarrant-county/index.astro";
const $$url = "/locations/tarrant-county";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
