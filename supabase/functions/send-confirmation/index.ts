import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  name: string;
  email: string;
  industry: string;
}

const sendEmailWithResend = async (
  to: string,
  subject: string,
  html: string,
  resendApiKey: string
) => {
  try {
    console.log(`Sending email to: ${to}`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Innovation Community <piyush@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', responseData);
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    console.log('Email sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const generatePersonalizedContent = async (name: string, industry: string): Promise<string> => {
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    // If no OpenAI key, return fallback content
    if (!openaiKey) {
      console.log('OpenAI API key not configured, using fallback content');
      return `Hi ${name}! 🚀 

Welcome to our innovation community! We're thrilled to have someone from the ${industry} industry join us. 

Get ready to discover cutting-edge insights, connect with fellow innovators, and unlock new opportunities that will transform how you work in ${industry}. 

This is just the beginning of your innovation journey!`;
    }

    console.log('Generating personalized content with OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing exciting, personalized welcome emails for an innovation community. Create super short, energetic content that gets people excited about revolutionizing their industry. Keep it under 150 words total.'
          },
          {
            role: 'user',
            content: `Create a personalized welcome email for ${name} who works in the ${industry} industry. Focus on how this innovation community will help them revolutionize their specific industry. Be enthusiastic and inspiring. Include industry-specific opportunities and innovations they could be part of.`
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices[0]?.message?.content;
    
    if (content) {
      console.log('OpenAI content generated successfully');
      return content;
    } else {
      throw new Error('No content received from OpenAI API');
    }
  } catch (error) {
    console.error('Error generating personalized content with OpenAI:', error);
    // Fallback content if OpenAI fails
    return `Hi ${name}! 🚀 

Welcome to our innovation community! We're thrilled to have someone from the ${industry} industry join us. 

Get ready to discover cutting-edge insights, connect with fellow innovators, and unlock new opportunities that will transform how you work in ${industry}. 

This is just the beginning of your innovation journey!`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log(`Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, industry }: ConfirmationEmailRequest = await req.json();
    
    console.log(`Processing email for: ${name} (${email}) from ${industry}`);

    // Validate required fields
    if (!name || !email || !industry) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, or industry" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if Resend API key is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate personalized content
    const personalizedContent = await generatePersonalizedContent(name, industry);

    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">🚀 Welcome to the Innovation Revolution!</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px;">
          <div style="font-size: 18px; line-height: 1.6;">
            ${personalizedContent.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>🎯 <strong>Exclusive insights</strong> tailored to ${industry}</li>
            <li>💡 <strong>Early access</strong> to industry-changing innovations</li>
            <li>🤝 <strong>Connect</strong> with ${industry} leaders and visionaries</li>
            <li>📈 <strong>Transform your approach</strong> to ${industry} challenges</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">
            Ready to revolutionize ${industry}?<br>
            <strong>The Innovation Community Team</strong>
          </p>
        </div>
      </div>
    `;

    // Send email using Resend API
    const emailResponse = await sendEmailWithResend(
      email,
      `Welcome to the Innovation Revolution, ${name}! 🚀`,
      emailHtml,
      resendKey
    );

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.id,
      message: "Email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);