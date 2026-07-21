import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    return NextResponse.json({
      status: "error",
      message: "MONGODB_URI environment variable is not defined in your Netlify dashboard."
    });
  }

  // Redact password for security
  const redactedUri = uri.replace(/:([^@]+)@/, ":******@");

  if (uri.includes("<db_password>")) {
    return NextResponse.json({
      status: "error",
      message: "You did not replace the '<db_password>' placeholder with your actual database user password in Netlify.",
      redactedUri
    });
  }

  try {
    // 5-second timeout for quick feedback
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db("Quick Reply");
    
    // Ping command to verify database access
    await db.command({ ping: 1 });
    await client.close();

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to your MongoDB cluster!",
      redactedUri
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: `Failed to connect to MongoDB: ${err.message}`,
      redactedUri,
      tips: [
        "Ensure your password in the connection string does not contain unencoded special characters like '@', ':', '/', or '+'. URL-encode them if they do.",
        "Ensure your MongoDB Atlas Network Access rules whitelist 0.0.0.0/0 (allows serverless functions on Netlify to connect).",
        "Verify that your database user credentials have full read/write permissions."
      ]
    });
  }
}
