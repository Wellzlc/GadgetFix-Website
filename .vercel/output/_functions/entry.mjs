import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BZHSl532.mjs';
import { manifest } from './manifest_CihvbWZU.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/admin/antispam.astro.mjs');
const _page3 = () => import('./pages/admin/antispam-test.astro.mjs');
const _page4 = () => import('./pages/api/antispam/dashboard.astro.mjs');
const _page5 = () => import('./pages/api/antispam/feedback.astro.mjs');
const _page6 = () => import('./pages/api/antispam/validate.astro.mjs');
const _page7 = () => import('./pages/blog.astro.mjs');
const _page8 = () => import('./pages/contact.astro.mjs');
const _page9 = () => import('./pages/contact-computer.astro.mjs');
const _page10 = () => import('./pages/emergency-phone-repair.astro.mjs');
const _page11 = () => import('./pages/faq.astro.mjs');
const _page12 = () => import('./pages/iphone-repair-dallas.astro.mjs');
const _page13 = () => import('./pages/locations/collin-county/allen.astro.mjs');
const _page14 = () => import('./pages/locations/collin-county/anna.astro.mjs');
const _page15 = () => import('./pages/locations/collin-county/celina.astro.mjs');
const _page16 = () => import('./pages/locations/collin-county/fairview.astro.mjs');
const _page17 = () => import('./pages/locations/collin-county/frisco.astro.mjs');
const _page18 = () => import('./pages/locations/collin-county/lucas.astro.mjs');
const _page19 = () => import('./pages/locations/collin-county/mckinney.astro.mjs');
const _page20 = () => import('./pages/locations/collin-county/melissa.astro.mjs');
const _page21 = () => import('./pages/locations/collin-county/murphy.astro.mjs');
const _page22 = () => import('./pages/locations/collin-county/parker.astro.mjs');
const _page23 = () => import('./pages/locations/collin-county/princeton.astro.mjs');
const _page24 = () => import('./pages/locations/collin-county/prosper.astro.mjs');
const _page25 = () => import('./pages/locations/collin-county/wylie.astro.mjs');
const _page26 = () => import('./pages/locations/collin-county.astro.mjs');
const _page27 = () => import('./pages/locations/dallas-county/addison.astro.mjs');
const _page28 = () => import('./pages/locations/dallas-county/carrollton.astro.mjs');
const _page29 = () => import('./pages/locations/dallas-county/cedar-hill.astro.mjs');
const _page30 = () => import('./pages/locations/dallas-county/dallas.astro.mjs');
const _page31 = () => import('./pages/locations/dallas-county/desoto.astro.mjs');
const _page32 = () => import('./pages/locations/dallas-county/duncanville.astro.mjs');
const _page33 = () => import('./pages/locations/dallas-county/farmers-branch.astro.mjs');
const _page34 = () => import('./pages/locations/dallas-county/garland.astro.mjs');
const _page35 = () => import('./pages/locations/dallas-county/highland-park.astro.mjs');
const _page36 = () => import('./pages/locations/dallas-county/irving.astro.mjs');
const _page37 = () => import('./pages/locations/dallas-county/lancaster.astro.mjs');
const _page38 = () => import('./pages/locations/dallas-county/mesquite.astro.mjs');
const _page39 = () => import('./pages/locations/dallas-county/plano.astro.mjs');
const _page40 = () => import('./pages/locations/dallas-county/richardson.astro.mjs');
const _page41 = () => import('./pages/locations/dallas-county/rowlett.astro.mjs');
const _page42 = () => import('./pages/locations/dallas-county/sachse.astro.mjs');
const _page43 = () => import('./pages/locations/dallas-county/university-park.astro.mjs');
const _page44 = () => import('./pages/locations/dallas-county.astro.mjs');
const _page45 = () => import('./pages/locations/denton-county/argyle.astro.mjs');
const _page46 = () => import('./pages/locations/denton-county/coppell.astro.mjs');
const _page47 = () => import('./pages/locations/denton-county/corinth.astro.mjs');
const _page48 = () => import('./pages/locations/denton-county/denton.astro.mjs');
const _page49 = () => import('./pages/locations/denton-county/flower-mound.astro.mjs');
const _page50 = () => import('./pages/locations/denton-county/hickory-creek.astro.mjs');
const _page51 = () => import('./pages/locations/denton-county/highland-village.astro.mjs');
const _page52 = () => import('./pages/locations/denton-county/lake-dallas.astro.mjs');
const _page53 = () => import('./pages/locations/denton-county/lewisville.astro.mjs');
const _page54 = () => import('./pages/locations/denton-county/little-elm.astro.mjs');
const _page55 = () => import('./pages/locations/denton-county/roanoke.astro.mjs');
const _page56 = () => import('./pages/locations/denton-county/the-colony.astro.mjs');
const _page57 = () => import('./pages/locations/denton-county/trophy-club.astro.mjs');
const _page58 = () => import('./pages/locations/denton-county.astro.mjs');
const _page59 = () => import('./pages/locations/ellis-county/midlothian.astro.mjs');
const _page60 = () => import('./pages/locations/ellis-county/red-oak.astro.mjs');
const _page61 = () => import('./pages/locations/ellis-county/waxahachie.astro.mjs');
const _page62 = () => import('./pages/locations/ellis-county.astro.mjs');
const _page63 = () => import('./pages/locations/kaufman-county/forney.astro.mjs');
const _page64 = () => import('./pages/locations/kaufman-county/terrell.astro.mjs');
const _page65 = () => import('./pages/locations/kaufman-county.astro.mjs');
const _page66 = () => import('./pages/locations/rockwall-county/fate.astro.mjs');
const _page67 = () => import('./pages/locations/rockwall-county/heath.astro.mjs');
const _page68 = () => import('./pages/locations/rockwall-county/mclendon-chisholm.astro.mjs');
const _page69 = () => import('./pages/locations/rockwall-county/rockwall.astro.mjs');
const _page70 = () => import('./pages/locations/rockwall-county/royse-city.astro.mjs');
const _page71 = () => import('./pages/locations/rockwall-county.astro.mjs');
const _page72 = () => import('./pages/locations/tarrant-county/arlington.astro.mjs');
const _page73 = () => import('./pages/locations/tarrant-county/bedford.astro.mjs');
const _page74 = () => import('./pages/locations/tarrant-county/benbrook.astro.mjs');
const _page75 = () => import('./pages/locations/tarrant-county/burleson.astro.mjs');
const _page76 = () => import('./pages/locations/tarrant-county/colleyville.astro.mjs');
const _page77 = () => import('./pages/locations/tarrant-county/crowley.astro.mjs');
const _page78 = () => import('./pages/locations/tarrant-county/euless.astro.mjs');
const _page79 = () => import('./pages/locations/tarrant-county/fort-worth.astro.mjs');
const _page80 = () => import('./pages/locations/tarrant-county/grand-prairie.astro.mjs');
const _page81 = () => import('./pages/locations/tarrant-county/grapevine.astro.mjs');
const _page82 = () => import('./pages/locations/tarrant-county/haltom-city.astro.mjs');
const _page83 = () => import('./pages/locations/tarrant-county/hurst.astro.mjs');
const _page84 = () => import('./pages/locations/tarrant-county/keller.astro.mjs');
const _page85 = () => import('./pages/locations/tarrant-county/mansfield.astro.mjs');
const _page86 = () => import('./pages/locations/tarrant-county/north-richland-hills.astro.mjs');
const _page87 = () => import('./pages/locations/tarrant-county/richland-hills.astro.mjs');
const _page88 = () => import('./pages/locations/tarrant-county/southlake.astro.mjs');
const _page89 = () => import('./pages/locations/tarrant-county/watauga.astro.mjs');
const _page90 = () => import('./pages/locations/tarrant-county/white-settlement.astro.mjs');
const _page91 = () => import('./pages/locations/tarrant-county.astro.mjs');
const _page92 = () => import('./pages/locations.astro.mjs');
const _page93 = () => import('./pages/mac-troubleshooting.astro.mjs');
const _page94 = () => import('./pages/mac-troubleshooting-dfw.astro.mjs');
const _page95 = () => import('./pages/samsung-repair-fort-worth.astro.mjs');
const _page96 = () => import('./pages/screen-replacement.astro.mjs');
const _page97 = () => import('./pages/services.astro.mjs');
const _page98 = () => import('./pages/windows-troubleshooting.astro.mjs');
const _page99 = () => import('./pages/windows-troubleshooting-dfw.astro.mjs');
const _page100 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/admin/antispam.astro", _page2],
    ["src/pages/admin/antispam-test.astro", _page3],
    ["src/pages/api/antispam/dashboard.ts", _page4],
    ["src/pages/api/antispam/feedback.ts", _page5],
    ["src/pages/api/antispam/validate.ts", _page6],
    ["src/pages/blog.astro", _page7],
    ["src/pages/contact.astro", _page8],
    ["src/pages/contact-computer.astro", _page9],
    ["src/pages/emergency-phone-repair.astro", _page10],
    ["src/pages/faq.astro", _page11],
    ["src/pages/iphone-repair-dallas.astro", _page12],
    ["src/pages/locations/collin-county/allen.astro", _page13],
    ["src/pages/locations/collin-county/anna.astro", _page14],
    ["src/pages/locations/collin-county/celina.astro", _page15],
    ["src/pages/locations/collin-county/fairview.astro", _page16],
    ["src/pages/locations/collin-county/frisco.astro", _page17],
    ["src/pages/locations/collin-county/lucas.astro", _page18],
    ["src/pages/locations/collin-county/mckinney.astro", _page19],
    ["src/pages/locations/collin-county/melissa.astro", _page20],
    ["src/pages/locations/collin-county/murphy.astro", _page21],
    ["src/pages/locations/collin-county/parker.astro", _page22],
    ["src/pages/locations/collin-county/princeton.astro", _page23],
    ["src/pages/locations/collin-county/prosper.astro", _page24],
    ["src/pages/locations/collin-county/wylie.astro", _page25],
    ["src/pages/locations/collin-county/index.astro", _page26],
    ["src/pages/locations/dallas-county/addison.astro", _page27],
    ["src/pages/locations/dallas-county/carrollton.astro", _page28],
    ["src/pages/locations/dallas-county/cedar-hill.astro", _page29],
    ["src/pages/locations/dallas-county/dallas.astro", _page30],
    ["src/pages/locations/dallas-county/desoto.astro", _page31],
    ["src/pages/locations/dallas-county/duncanville.astro", _page32],
    ["src/pages/locations/dallas-county/farmers-branch.astro", _page33],
    ["src/pages/locations/dallas-county/garland.astro", _page34],
    ["src/pages/locations/dallas-county/highland-park.astro", _page35],
    ["src/pages/locations/dallas-county/irving.astro", _page36],
    ["src/pages/locations/dallas-county/lancaster.astro", _page37],
    ["src/pages/locations/dallas-county/mesquite.astro", _page38],
    ["src/pages/locations/dallas-county/plano.astro", _page39],
    ["src/pages/locations/dallas-county/richardson.astro", _page40],
    ["src/pages/locations/dallas-county/rowlett.astro", _page41],
    ["src/pages/locations/dallas-county/sachse.astro", _page42],
    ["src/pages/locations/dallas-county/university-park.astro", _page43],
    ["src/pages/locations/dallas-county/index.astro", _page44],
    ["src/pages/locations/denton-county/argyle.astro", _page45],
    ["src/pages/locations/denton-county/coppell.astro", _page46],
    ["src/pages/locations/denton-county/corinth.astro", _page47],
    ["src/pages/locations/denton-county/denton.astro", _page48],
    ["src/pages/locations/denton-county/flower-mound.astro", _page49],
    ["src/pages/locations/denton-county/hickory-creek.astro", _page50],
    ["src/pages/locations/denton-county/highland-village.astro", _page51],
    ["src/pages/locations/denton-county/lake-dallas.astro", _page52],
    ["src/pages/locations/denton-county/lewisville.astro", _page53],
    ["src/pages/locations/denton-county/little-elm.astro", _page54],
    ["src/pages/locations/denton-county/roanoke.astro", _page55],
    ["src/pages/locations/denton-county/the-colony.astro", _page56],
    ["src/pages/locations/denton-county/trophy-club.astro", _page57],
    ["src/pages/locations/denton-county/index.astro", _page58],
    ["src/pages/locations/ellis-county/midlothian.astro", _page59],
    ["src/pages/locations/ellis-county/red-oak.astro", _page60],
    ["src/pages/locations/ellis-county/waxahachie.astro", _page61],
    ["src/pages/locations/ellis-county/index.astro", _page62],
    ["src/pages/locations/kaufman-county/forney.astro", _page63],
    ["src/pages/locations/kaufman-county/terrell.astro", _page64],
    ["src/pages/locations/kaufman-county/index.astro", _page65],
    ["src/pages/locations/rockwall-county/fate.astro", _page66],
    ["src/pages/locations/rockwall-county/heath.astro", _page67],
    ["src/pages/locations/rockwall-county/mclendon-chisholm.astro", _page68],
    ["src/pages/locations/rockwall-county/rockwall.astro", _page69],
    ["src/pages/locations/rockwall-county/royse-city.astro", _page70],
    ["src/pages/locations/rockwall-county/index.astro", _page71],
    ["src/pages/locations/tarrant-county/arlington.astro", _page72],
    ["src/pages/locations/tarrant-county/bedford.astro", _page73],
    ["src/pages/locations/tarrant-county/benbrook.astro", _page74],
    ["src/pages/locations/tarrant-county/burleson.astro", _page75],
    ["src/pages/locations/tarrant-county/colleyville.astro", _page76],
    ["src/pages/locations/tarrant-county/crowley.astro", _page77],
    ["src/pages/locations/tarrant-county/euless.astro", _page78],
    ["src/pages/locations/tarrant-county/fort-worth.astro", _page79],
    ["src/pages/locations/tarrant-county/grand-prairie.astro", _page80],
    ["src/pages/locations/tarrant-county/grapevine.astro", _page81],
    ["src/pages/locations/tarrant-county/haltom-city.astro", _page82],
    ["src/pages/locations/tarrant-county/hurst.astro", _page83],
    ["src/pages/locations/tarrant-county/keller.astro", _page84],
    ["src/pages/locations/tarrant-county/mansfield.astro", _page85],
    ["src/pages/locations/tarrant-county/north-richland-hills.astro", _page86],
    ["src/pages/locations/tarrant-county/richland-hills.astro", _page87],
    ["src/pages/locations/tarrant-county/southlake.astro", _page88],
    ["src/pages/locations/tarrant-county/watauga.astro", _page89],
    ["src/pages/locations/tarrant-county/white-settlement.astro", _page90],
    ["src/pages/locations/tarrant-county/index.astro", _page91],
    ["src/pages/locations/index.astro", _page92],
    ["src/pages/mac-troubleshooting.astro", _page93],
    ["src/pages/mac-troubleshooting-dfw.astro", _page94],
    ["src/pages/samsung-repair-fort-worth.astro", _page95],
    ["src/pages/screen-replacement.astro", _page96],
    ["src/pages/services.astro", _page97],
    ["src/pages/windows-troubleshooting.astro", _page98],
    ["src/pages/windows-troubleshooting-dfw.astro", _page99],
    ["src/pages/index.astro", _page100]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "289a1576-a9e0-4142-a3bf-7d7965d4951d",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
