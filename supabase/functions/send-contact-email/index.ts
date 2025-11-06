import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  podcastName: string;
  creatorName: string;
  email: string;
  podcastUrl: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const recipientEmail = Deno.env.get("CONTACT_EMAIL");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!recipientEmail) {
      throw new Error("CONTACT_EMAIL is not configured");
    }

    const formData: ContactFormData = await req.json();

    const { podcastName, creatorName, email, podcastUrl, message } = formData;

    if (!podcastName || !creatorName || !email || !podcastUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailHtml = `
      <h2>New Podcast Space Inquiry</h2>
      <p><strong>Podcast Name:</strong> ${podcastName}</p>
      <p><strong>Creator Name:</strong> ${creatorName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Podcast URL/RSS:</strong> ${podcastUrl}</p>
      ${message ? `<p><strong>Additional Information:</strong></p><p>${message}</p>` : ""}
      <hr>
      <p style="color: #666; font-size: 12px;">This inquiry was submitted via the Augmented Pods contact form.</p>
    `;

    const emailText = `
New Podcast Space Inquiry

Podcast Name: ${podcastName}
Creator Name: ${creatorName}
Email: ${email}
Podcast URL/RSS: ${podcastUrl}
${message ? `\nAdditional Information:\n${message}` : ""}

---
This inquiry was submitted via the Augmented Pods contact form.
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Augmented Pods <onboarding@resend.dev>",
        to: recipientEmail,
        reply_to: email,
        subject: `New Podcast Inquiry: ${podcastName}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to send email",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});