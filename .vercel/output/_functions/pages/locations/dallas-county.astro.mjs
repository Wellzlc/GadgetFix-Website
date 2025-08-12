import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_BEFgHyqX.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_d87RFhlu.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const countyName = "Dallas County";
  const cities = ["Dallas", "Plano", "Irving", "Garland", "Mesquite", "Richardson", "Carrollton", "Rowlett", "Duncanville", "Cedar Hill", "Lancaster", "Sachse", "Addison", "Farmers Branch", "University Park", "Highland Park", "DeSoto"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Phone Repair ${countyName} TX | All Cities | GadgetFix`, "description": `Mobile phone repair service throughout ${countyName}. We serve all cities with same-day service. Call (402) 416-6942`, "data-astro-cid-rqflehb6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main data-astro-cid-rqflehb6> <!-- Hero Section - SAME AS HOMEPAGE --> <section class="hero" data-astro-cid-rqflehb6> <div class="container" data-astro-cid-rqflehb6> <div class="hero-content" data-astro-cid-rqflehb6> <h1 class="hero-title" data-astro-cid-rqflehb6>${countyName} Phone Repair</h1> <p class="hero-subtitle" data-astro-cid-rqflehb6>Select Your City for Mobile Device Repair Service</p> <div class="hero-cta" data-astro-cid-rqflehb6> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-rqflehb6>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> <!-- Cities Grid - CLEAN LIKE HOMEPAGE SERVICES --> <section class="cities-section" data-astro-cid-rqflehb6> <div class="container" data-astro-cid-rqflehb6> <h2 class="section-title" data-astro-cid-rqflehb6>Select Your City in ${countyName}</h2> <div class="cities-grid" data-astro-cid-rqflehb6> ${cities.map((city) => renderTemplate`<a${addAttribute(`/locations/dallas-county/${city.toLowerCase().replace(" ", "-")}`, "href")} class="city-card" data-astro-cid-rqflehb6> <h3 data-astro-cid-rqflehb6>${city}</h3> <p data-astro-cid-rqflehb6>Mobile repair service</p> </a>`)} </div> </div> </section> <!-- Service Info - CLEAN PROFESSIONAL --> <section class="info-section" data-astro-cid-rqflehb6> <div class="container" data-astro-cid-rqflehb6> <h2 class="section-title" data-astro-cid-rqflehb6>Mobile Service Throughout ${countyName}</h2> <p data-astro-cid-rqflehb6>GadgetFix provides professional device repair across all of ${countyName}. Our mobile technicians come directly to your location for convenient, fast service. All repairs backed by our 90-day warranty.</p> <div class="service-features" data-astro-cid-rqflehb6> <div class="feature" data-astro-cid-rqflehb6> <h3 data-astro-cid-rqflehb6>Same Day Service</h3> <p data-astro-cid-rqflehb6>Fast response throughout ${countyName}</p> </div> <div class="feature" data-astro-cid-rqflehb6> <h3 data-astro-cid-rqflehb6>We Come to You</h3> <p data-astro-cid-rqflehb6>Mobile service at your location</p> </div> <div class="feature" data-astro-cid-rqflehb6> <h3 data-astro-cid-rqflehb6>90-Day Warranty</h3> <p data-astro-cid-rqflehb6>All repairs guaranteed</p> </div> </div> </div> </section> <!-- CTA Section - SAME AS HOMEPAGE --> <section class="final-cta" data-astro-cid-rqflehb6> <div class="container" data-astro-cid-rqflehb6> <div class="cta-content" data-astro-cid-rqflehb6> <h2 data-astro-cid-rqflehb6>READY FOR DEVICE REPAIR?</h2> <p data-astro-cid-rqflehb6>Professional mobile service throughout ${countyName}</p> <div class="cta-buttons" data-astro-cid-rqflehb6> <a href="tel:+14024166942" class="btn btn-primary btn-large" data-astro-cid-rqflehb6>CALL NOW FOR SERVICE</a> </div> </div> </div> </section> </main> ` })} `;
}, "C:/Users/gadge/GadgetFix-Website/src/pages/locations/dallas-county/index.astro", void 0);

const $$file = "C:/Users/gadge/GadgetFix-Website/src/pages/locations/dallas-county/index.astro";
const $$url = "/locations/dallas-county";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
