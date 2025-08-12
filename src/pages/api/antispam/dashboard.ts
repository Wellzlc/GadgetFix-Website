/**
 * API endpoint for dashboard data
 * Returns statistics and current status of the anti-spam system
 */

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Mock data for now - in production, this would pull from your database
  const dashboardData = {
    stats: {
      total: 127,
      blocked: 45,
      quarantined: 12,
      allowed: 70
    },
    threatLevel: 0.35, // 0-1 scale
    recentActivity: [
      {
        action: 'Blocked',
        ip: '192.168.1.1',
        timestamp: new Date().toISOString()
      },
      {
        action: 'Allowed',
        ip: '10.0.0.1',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        action: 'Quarantined',
        ip: '172.16.0.1',
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ],
    quarantine: [
      {
        id: 'q_1234567890',
        confidence: 0.75,
        threats: ['URL_IN_NAME', 'RAPID_SUBMISSION'],
        timestamp: new Date(Date.now() - 3600000).toISOString()
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
      'Content-Type': 'application/json'
    }
  });
};