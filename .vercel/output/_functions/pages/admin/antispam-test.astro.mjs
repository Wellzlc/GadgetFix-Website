import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BEFgHyqX.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_d87RFhlu.mjs';
/* empty css                                            */
export { renderers } from '../../renderers.mjs';

const $$AntispamTest = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anti-Spam Dashboard | GadgetFix Admin", "data-astro-cid-ycfhuooq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="admin-container" data-astro-cid-ycfhuooq> <h1 data-astro-cid-ycfhuooq>SpamGuard Dashboard</h1> <div id="auth-status" data-astro-cid-ycfhuooq>Checking authentication...</div> <div id="dashboard-content" style="display: none;" data-astro-cid-ycfhuooq> <h2 data-astro-cid-ycfhuooq>Dashboard Content</h2> <p data-astro-cid-ycfhuooq>You are logged in!</p> <button id="logout-btn" data-astro-cid-ycfhuooq>Logout</button> </div> </div> ` })}  ${renderScript($$result, "C:/Users/gadge/GadgetFix-Website/src/pages/admin/antispam-test.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/gadge/GadgetFix-Website/src/pages/admin/antispam-test.astro", void 0);

const $$file = "C:/Users/gadge/GadgetFix-Website/src/pages/admin/antispam-test.astro";
const $$url = "/admin/antispam-test";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AntispamTest,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
