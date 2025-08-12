import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_BEFgHyqX.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_d87RFhlu.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const countyName = "Ellis County";
  const cities = ["Waxahachie", "Red Oak", "Midlothian"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Phone Repair ${countyName} TX | All Cities | GadgetFix`, "description": `Mobile phone repair service throughout ${countyName}. We serve all cities with same-day service. Call (402) 416-6942`, "data-astro-cid-qylkvll7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main data-astro-cid-qylkvll7> <!-- Hero Section - SAME AS HOMEPAGE --> <section class="hero" data-astro-cid-qylkvll7> <div class="container" data-astro-cid-qylkvll7> <div class="hero-content" data-astro-cid-qylkvll7> <h1 class="hero-title" data-astro-cid-qylkvll7>${countyName} Phone Repair</h1> <p class="hero-subtitle" data-astro-cid-qylkvll7>Select Your City for Mobile Device Repair Service</p> <div class="hero-cta" data-astro-cid-qylkvll7> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-qylkvll7>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> <!-- Cities Grid - CLEAN LIKE HOMEPAGE SERVICES --> <section class="cities-section" data-astro-cid-qylkvll7> <div class="container" data-astro-cid-qylkvll7> <h2 class="section-title" data-astro-cid-qylkvll7>Select Your City in ${countyName}</h2> <div class="cities-grid" data-astro-cid-qylkvll7> ${cities.map((city) => renderTemplate`<a${addAttribute(`/locations/ellis-county/${city.toLowerCase().replace(" ", "-")}`, "href")} class="city-card" data-astro-cid-qylkvll7> <h3 data-astro-cid-qylkvll7>${city}</h3> <p data-astro-cid-qylkvll7>Mobile repair service</p> </a>`)} </div> </div> </section> <!-- Service Info - CLEAN PROFESSIONAL --> <section class="info-section" data-astro-cid-qylkvll7> <div class="container" data-astro-cid-qylkvll7> <h2 class="section-title" data-astro-cid-qylkvll7>Mobile Service Throughout ${countyName}</h2> <p data-astro-cid-qylkvll7>GadgetFix provides professional device repair across all of ${countyName}. Our mobile technicians come directly to your location for convenient, fast service. All repairs backed by our 90-day warranty.</p> <div class="service-features" data-astro-cid-qylkvll7> <div class="feature" data-astro-cid-qylkvll7> <h3 data-astro-cid-qylkvll7>Same Day Service</h3> <p data-astro-cid-qylkvll7>Fast response throughout ${countyName}</p> </div> <div class="feature" data-astro-cid-qylkvll7> <h3 data-astro-cid-qylkvll7>We Come to You</h3> <p data-astro-cid-qylkvll7>Mobile service at your location</p> </div> <div class="feature" data-astro-cid-qylkvll7> <h3 data-astro-cid-qylkvll7>90-Day Warranty</h3> <p data-astro-cid-qylkvll7>All repairs guaranteed</p> </div> </div> </div> </section> <!-- CTA Section - SAME AS HOMEPAGE --> <section class="final-cta" data-astro-cid-qylkvll7> <div class="container" data-astro-cid-qylkvll7> <div class="cta-content" data-astro-cid-qylkvll7> <h2 data-astro-cid-qylkvll7>READY FOR DEVICE REPAIR?</h2> <p data-astro-cid-qylkvll7>Professional mobile service throughout ${countyName}</p> <div class="cta-buttons" data-astro-cid-qylkvll7> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-qylkvll7>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> </main> ` })} `;
}, "C:/Users/gadge/GadgetFix-Website/src/pages/locations/ellis-county/index.astro", void 0);

const $$file = "C:/Users/gadge/GadgetFix-Website/src/pages/locations/ellis-county/index.astro";
const $$url = "/locations/ellis-county";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
