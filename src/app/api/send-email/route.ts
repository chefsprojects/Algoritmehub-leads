import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { to, subject, body, leadName } = await request.json();

        if (!to || !subject || !body) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, body' },
                { status: 400 }
            );
        }

        const fromEmail = process.env.FROM_EMAIL || 'info@embedai.nl';

        const { data, error } = await resend.emails.send({
            from: `Algoritmehub <${fromEmail}>`,
            to: [to],
            subject: subject,
            text: body,
            // Add reply tracking header
            headers: {
                'X-Lead-Name': leadName || 'Unknown',
            },
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            emailId: data?.id,
            message: `Email sent to ${to}`,
            leadName,
            sentAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Send email error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
