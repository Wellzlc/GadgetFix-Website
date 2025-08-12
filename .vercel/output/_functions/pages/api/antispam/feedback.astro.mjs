import { S as SpamGuard } from '../../../chunks/SpamGuard_BF-8-HAH.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const spamGuard = new SpamGuard();
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const { submissionId, wasSpam, feedback, quarantineId } = data;
    if (!submissionId && !quarantineId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Submission ID or Quarantine ID required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await spamGuard.provideFeedback(
      submissionId || quarantineId,
      wasSpam,
      feedback
    );
    console.log(`[FEEDBACK] ID: ${submissionId || quarantineId}, Was Spam: ${wasSpam}, Notes: ${feedback || "None"}`);
    return new Response(JSON.stringify({
      success: true,
      message: "Feedback recorded successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Feedback processing error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Error processing feedback"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const GET = async () => {
  try {
    const stats = {
      totalFeedback: 0,
      correctDetections: 0,
      falsePositives: 0,
      falseNegatives: 0,
      accuracy: 0,
      recentFeedback: []
    };
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch feedback statistics"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
