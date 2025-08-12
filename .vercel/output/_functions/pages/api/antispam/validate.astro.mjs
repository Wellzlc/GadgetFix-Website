import { S as SpamGuard } from '../../../chunks/SpamGuard_BF-8-HAH.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const spamGuard = new SpamGuard();
const POST = async ({ request }) => {
  try {
    const text = await request.text();
    console.log("Received form data:", text);
    if (!text) {
      throw new Error("Empty request body");
    }
    const formData = JSON.parse(text);
    const { name, email, phone, message, ...otherFields } = formData;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: formData.sessionId || "unknown",
      timestamp: /* @__PURE__ */ new Date(),
      fields: {
        name,
        email,
        phone,
        message,
        ...otherFields
      },
      metadata: {
        formId: formData.formId || "contact-form",
        formType: formData.formType || "contact",
        submissionTime: formData.submissionTime || 0,
        keystrokes: formData.keystrokes,
        mouseMovements: formData.mouseMovements,
        fieldFocusOrder: formData.fieldFocusOrder,
        copyPasteEvents: formData.copyPasteEvents,
        timezone: formData.timezone,
        language: formData.language,
        screenResolution: formData.screenResolution,
        colorDepth: formData.colorDepth,
        platform: formData.platform,
        plugins: formData.plugins
      },
      ip,
      userAgent,
      referrer
    };
    const result = await spamGuard.validate(submission);
    if (result.action === "block") {
      console.log(`[SPAM BLOCKED] IP: ${ip}, Confidence: ${result.confidence}, Threats: ${result.threats.map((t) => t.type).join(", ")}`);
      return new Response(JSON.stringify({
        success: false,
        message: "Your submission has been blocked. Please contact us directly at (402) 416-6942 if you believe this is an error.",
        reason: "spam_detected"
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (result.action === "quarantine") {
      return new Response(JSON.stringify({
        success: true,
        message: "Your submission has been received and is pending review. We will contact you within 24 hours.",
        quarantineId: result.quarantineId,
        status: "pending_review",
        action: "quarantine"
      }), {
        status: 202,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`[FORM ACCEPTED] From: ${email}, Type: ${formData.formType}, Confidence: ${result.confidence}`);
    return new Response(JSON.stringify({
      success: true,
      message: "Validation passed",
      status: "accepted",
      action: "allow"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Form validation error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred processing your submission. Please try again or call (402) 416-6942."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
