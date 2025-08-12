/**
 * API endpoint for providing feedback on spam detection results
 * Helps the system learn and improve accuracy over time
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { SpamGuard } from '../../../lib/antispam/SpamGuard';

// Initialize SpamGuard instance
const spamGuard = new SpamGuard();

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { submissionId, wasSpam, feedback, quarantineId } = data;
    
    if (!submissionId && !quarantineId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Submission ID or Quarantine ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Record feedback for learning
    await spamGuard.provideFeedback(
      submissionId || quarantineId,
      wasSpam,
      feedback
    );
    
    // Log feedback for analysis
    console.log(`[FEEDBACK] ID: ${submissionId || quarantineId}, Was Spam: ${wasSpam}, Notes: ${feedback || 'None'}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback recorded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Feedback processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error processing feedback'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  // Return feedback statistics
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch feedback statistics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};