export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  const dashboardData = {
    stats: {
      total: 127,
      blocked: 45,
      quarantined: 12,
      allowed: 70
    },
    threatLevel: 0.35,
    // 0-1 scale
    recentActivity: [
      {
        action: "Blocked",
        ip: "192.168.1.1",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        action: "Allowed",
        ip: "10.0.0.1",
        timestamp: new Date(Date.now() - 3e5).toISOString()
      },
      {
        action: "Quarantined",
        ip: "172.16.0.1",
        timestamp: new Date(Date.now() - 6e5).toISOString()
      }
    ],
    quarantine: [
      {
        id: "q_1234567890",
        confidence: 0.75,
        threats: ["URL_IN_NAME", "RAPID_SUBMISSION"],
        timestamp: new Date(Date.now() - 36e5).toISOString()
      }
    ],
    performance: {
      avgProcessing: 45.2,
      p95Processing: 125.8,
      successRate: 0.945
    }
  };
  return new Response(JSON.stringify(dashboardData), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
