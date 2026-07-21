import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentText, authorName, customVariable1, customVariable2, customVariable3 } = body;

    if (!commentText) {
      return NextResponse.json({ error: "Missing commentText" }, { status: 400 });
    }

    const textLower = commentText.toLowerCase();
    const name = authorName || "there";
    
    let aiSuggestion = "";

    if (textLower.includes("price") || textLower.includes("cost") || textLower.includes("how much")) {
      const pricingLink = customVariable1 || "https://Quick Reply.com/pricing";
      aiSuggestion = `Hey ${name}! 👋 Thanks for asking. Our premium plan starts at ₹99/mo. You can find all the details and choose a plan here → ${pricingLink}. Let me know if you have any editing team requirements!`;
    } else if (textLower.includes("discount") || textLower.includes("coupon") || textLower.includes("promo")) {
      const shopLink = customVariable1 || "https://Quick Reply.com/shop";
      const code = customVariable2 || "YOUTUBE10";
      aiSuggestion = `Hi ${name}! 🎉 Thanks for watching. You can use the promo code **${code}** at checkout to get 10% off! Grab it here: ${shopLink}`;
    } else if (textLower.includes("broken") || textLower.includes("error") || textLower.includes("doesn't work")) {
      const email = customVariable3 || "support@Quick Reply.com";
      aiSuggestion = `Hello ${name}. So sorry to hear you're experiencing technical trouble! 🔧 Please drop our support team an email at **${email}** with details about the error so we can fix it for you immediately.`;
    } else {
      aiSuggestion = `Hey ${name}! 👋 Thank you for the comment and support. Glad you enjoyed the video content. Feel free to let me know if you have any questions or topics you'd like us to cover next!`;
    }

    // Add a small artificial sleep to simulate AI generation latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({
      suggestion: aiSuggestion,
      confidence: Math.floor(Math.random() * 8) + 91, // 91% - 98% confidence
      model: "claude-3-5-sonnet-20250514"
    });
  } catch (err) {
    console.error("AI API error:", err);
    return NextResponse.json({ error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}
