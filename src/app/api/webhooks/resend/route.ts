import { NextRequest, NextResponse } from 'next/server';

// Webhook for receiving Resend events (email replies, bounces, etc.)
// Configure this URL in Resend dashboard: https://resend.com/webhooks

interface ResendWebhookPayload {
    type: string;
    created_at: string;
    data: {
        email_id: string;
        from: string;
        to: string[];
        subject: string;
        text?: string;
        html?: string;
        headers?: Record<string, string>;
    };
}

// Simple in-memory storage for demo (replace with database in production)
const receivedEmails: Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    receivedAt: string;
    leadName?: string;
}> = [];

export async function POST(request: NextRequest) {
    try {
        const payload: ResendWebhookPayload = await request.json();

        console.log('Resend webhook received:', payload.type);

        // Handle different webhook events
        switch (payload.type) {
            case 'email.delivered':
                console.log(`Email delivered to: ${payload.data.to.join(', ')}`);
                break;

            case 'email.bounced':
                console.log(`Email bounced for: ${payload.data.to.join(', ')}`);
                break;

            case 'email.complained':
                console.log(`Email marked as spam by: ${payload.data.to.join(', ')}`);
                break;

            // For inbound emails (if you have inbound configured)
            case 'email.received':
                const email = {
                    id: payload.data.email_id,
                    from: payload.data.from,
                    to: payload.data.to[0],
                    subject: payload.data.subject,
                    body: payload.data.text || '',
                    receivedAt: payload.created_at,
                    leadName: payload.data.headers?.['X-Lead-Name'],
                };

                receivedEmails.push(email);
                console.log(`Email received from: ${email.from}`);

                // Here you would update the lead status to "Reactie"
                // and store the email in your database
                break;

            default:
                console.log(`Unhandled webhook type: ${payload.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve received emails (for dashboard)
export async function GET() {
    return NextResponse.json({
        emails: receivedEmails,
        count: receivedEmails.length,
    });
}
